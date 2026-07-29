import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { listView, pencil, plus, trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import PathModal from '../forms/PathModal';
import PathNodesModal from '../forms/PathNodesModal';
import type { StoryNode, StoryEdge, StoryPath, PathFormData } from '../../../types';

interface Props {
	paths:        StoryPath[];
	nodes:        StoryNode[];
	edges:        StoryEdge[];
	onCreatePath: ( data: PathFormData ) => Promise< void >;
	onUpdatePath: ( pathId: number, data: PathFormData ) => Promise< void >;
	onDeletePath: ( pathId: number ) => void;
	onQuickNodeCreate: ( substoryId: number, pathId: number ) => Promise< StoryNode | undefined >;
	onPathNodesApply:  ( pathId: number, orderedNodeIds: number[], removedNodeIds: number[] ) => Promise< void >;
}

export default function PathsPanel( {
	paths, nodes, edges,
	onCreatePath, onUpdatePath, onDeletePath,
	onQuickNodeCreate, onPathNodesApply,
}: Props ) {
	const [ modal, setModal ] = useState< { open: boolean; path: StoryPath | null } >(
		{ open: false, path: null }
	);
	const [ nodesModalPath, setNodesModalPath ] = useState< StoryPath | null >( null );

	async function handleSave( data: PathFormData ) {
		if ( modal.path ) {
			await onUpdatePath( modal.path.id, data );
		} else {
			await onCreatePath( data );
		}
		setModal( { open: false, path: null } );
	}

	return (
		<div className="cns-panel cns-paths-panel">
			<h2>{ __( 'Story Paths', 'cns-story-suite' ) }</h2>
			<p className="description">
				{ __(
					'Paths group nodes so you can apply shared marker settings. Use "Manage nodes" to order and connect a path’s nodes without the canvas. Priority order: individual node settings > path settings > global settings.',
					'cns-story-suite'
				) }
			</p>

			<div style={ { marginBottom: 12 } }>
				<Button
					variant="primary"
					icon={ plus }
					onClick={ () => setModal( { open: true, path: null } ) }
				>
					{ __( 'Add Path', 'cns-story-suite' ) }
				</Button>
			</div>

			{ paths.length === 0 && (
				<p className="description">{ __( 'No paths yet.', 'cns-story-suite' ) }</p>
			) }

			{ paths.length > 0 && (
				<table className="wp-list-table widefat fixed striped">
					<thead>
						<tr>
							<th style={ { width: 24 } }></th>
							<th>{ __( 'Label', 'cns-story-suite' ) }</th>
							<th style={ { width: 80 } }>{ __( 'Marker', 'cns-story-suite' ) }</th>
							<th style={ { width: 60 } }>{ __( 'Nodes', 'cns-story-suite' ) }</th>
							<th style={ { width: 200 } }>{ __( 'Actions', 'cns-story-suite' ) }</th>
						</tr>
					</thead>
					<tbody>
						{ paths.map( ( path ) => (
							<tr key={ path.id }>
								<td>
									<span style={ {
										display: 'inline-block',
										width: 14, height: 14,
										borderRadius: path.markerType === 'ring' ? '50%' : 3,
										background: path.markerType === 'ring' ? 'transparent' : path.markerColor,
										border: `3px solid ${ path.markerColor }`,
										verticalAlign: 'middle',
									} } />
								</td>
								<td><strong>{ path.label || `Path #${ path.id }` }</strong></td>
								<td style={ { fontSize: 12, color: '#666' } }>
									{ path.markerType === 'ring'
										? __( 'Ring', 'cns-story-suite' )
										: __( 'Icon', 'cns-story-suite' ) }
								</td>
								<td>{ nodes.filter( ( n ) => n.pathId === path.id ).length }</td>
								<td>
									<div className="cns-actions-row">
										<Button
											size="small"
											icon={ listView }
											label={ __( 'Manage nodes: order, connect, add or remove', 'cns-story-suite' ) }
											onClick={ () => setNodesModalPath( path ) }
										>
											{ __( 'Manage nodes', 'cns-story-suite' ) }
										</Button>
										<Button
											size="small"
											icon={ pencil }
											label={ __( 'Edit', 'cns-story-suite' ) }
											onClick={ () => setModal( { open: true, path } ) }
										/>
										<Button
											size="small"
											icon={ trash }
											isDestructive
											label={ __( 'Delete', 'cns-story-suite' ) }
											onClick={ () => {
												if ( window.confirm( `Delete path "${ path.label }"? Nodes will become unassigned.` ) ) {
													onDeletePath( path.id );
												}
											} }
										/>
									</div>
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			) }

			{ modal.open && (
				<PathModal
					path={ modal.path }
					onSave={ handleSave }
					onClose={ () => setModal( { open: false, path: null } ) }
				/>
			) }

			{ nodesModalPath && (
				<PathNodesModal
					path={ nodesModalPath }
					nodes={ nodes }
					edges={ edges }
					onQuickNodeCreate={ onQuickNodeCreate }
					onApply={ onPathNodesApply }
					onClose={ () => setNodesModalPath( null ) }
				/>
			) }
		</div>
	);
}
