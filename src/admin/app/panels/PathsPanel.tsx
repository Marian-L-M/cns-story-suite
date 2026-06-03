import { useState } from '@wordpress/element';
import PathModal from '../forms/PathModal';
import type { StoryPath, PathFormData } from '../../../types';

interface Props {
	paths:        StoryPath[];
	onCreatePath: ( data: PathFormData ) => Promise< void >;
	onUpdatePath: ( pathId: number, data: PathFormData ) => Promise< void >;
	onDeletePath: ( pathId: number ) => void;
}

export default function PathsPanel( { paths, onCreatePath, onUpdatePath, onDeletePath }: Props ) {
	const [ modal, setModal ] = useState< { open: boolean; path: StoryPath | null } >(
		{ open: false, path: null }
	);

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
			<h2>Story Paths</h2>
			<p className="description">
				Paths group nodes so you can apply shared marker settings. Assign nodes to a path via the node editor.
				Priority order: individual node settings &gt; path settings &gt; global settings.
			</p>

			<div style={ { marginBottom: 12 } }>
				<button
					type="button"
					className="button button-primary"
					onClick={ () => setModal( { open: true, path: null } ) }
				>
					+ Add Path
				</button>
			</div>

			{ paths.length === 0 && (
				<p className="description">No paths yet.</p>
			) }

			{ paths.length > 0 && (
				<table className="wp-list-table widefat fixed striped">
					<thead>
						<tr>
							<th style={ { width: 24 } }></th>
							<th>Label</th>
							<th style={ { width: 80 } }>Marker</th>
							<th style={ { width: 120 } }>Actions</th>
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
									{ path.markerType === 'ring' ? 'Ring' : 'Icon' }
								</td>
								<td>
									<button
										className="button button-small"
										onClick={ () => setModal( { open: true, path } ) }
									>
										Edit
									</button>
									{ ' ' }
									<button
										className="button button-small cns-delete-link"
										onClick={ () => {
											if ( window.confirm( `Delete path "${ path.label }"? Nodes will become unassigned.` ) ) {
												onDeletePath( path.id );
											}
										} }
									>
										Delete
									</button>
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
		</div>
	);
}
