import { Button, __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { brush, closeSmall, pencil, starEmpty, trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import type { StoryNode, StoryEdge, StoryPath } from '../../../types';

interface Props {
	nodes:          StoryNode[];
	edges:          StoryEdge[];
	paths:          StoryPath[];
	startNodeId:    number | null;
	onEditNode:     ( nodeId: number ) => void;
	onDeleteNode:   ( nodeId: number ) => void;
	onSetStartNode: ( nodeId: number ) => void;
	onEdgeReorder:  ( edgeId: number, sortOrder: number ) => void;
	onEdgeDelete:   ( edgeId: number ) => void;
	onEditEdge:     ( edgeId: number ) => void;
}

function getDisplayTitle( node: StoryNode ): string {
	return node.titleOverride || node.substoryTitle || `Node #${ node.id }`;
}

export default function NodesPanel( {
	nodes, edges, paths, startNodeId,
	onEditNode, onDeleteNode, onSetStartNode,
	onEdgeReorder, onEdgeDelete, onEditEdge,
}: Props ) {
	const pathMap = new Map( paths.map( ( p ) => [ p.id, p ] ) );
	if ( ! nodes.length ) {
		return (
			<div className="cns-panel">
				<p>No nodes yet. Switch to the Canvas tab and click to add your first node.</p>
			</div>
		);
	}

	return (
		<div className="cns-panel cns-nodes-panel">
			<h2>Story Nodes</h2>
			<p className="description">
				Click "Set Start" to mark the first node visitors will see.
				Connections are managed via the Canvas tab.
			</p>

			<table className="wp-list-table widefat fixed striped">
				<thead>
					<tr>
						<th style={ { width: 32 } }></th>
						<th>Node</th>
						<th>Substory</th>
						<th>Outgoing connections</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{ nodes.map( ( node ) => {
						const outEdges = edges
							.filter( ( e ) => e.fromNodeId === node.id )
							.sort( ( a, b ) => a.sortOrder - b.sortOrder );

						return (
							<tr key={ node.id }>
								<td>
									<span
										className="cns-node-swatch"
										style={ {
											background:   node.iconType === 'thumbnail' || node.iconType === 'icon' ? 'transparent' : node.iconColor,
											width: 18, height: 18,
											display: 'inline-block',
											borderRadius: node.iconType === 'square' || node.iconType === 'diamond' ? 2 : '50%',
											transform:    node.iconType === 'diamond' ? 'rotate(45deg)' : undefined,
											border: '1px solid rgba(0,0,0,0.3)',
										} }
									/>
								</td>
								<td>
									<strong>{ getDisplayTitle( node ) }</strong>
									{ node.id === startNodeId && (
										<span className="cns-badge cns-badge--featured" style={ { marginLeft: 6 } }>
											Start
										</span>
									) }
									{ node.pathId && pathMap.has( node.pathId ) && (
										<span className="cns-badge" style={ {
											marginLeft: 6,
											background: pathMap.get( node.pathId )!.markerColor,
											color: '#fff',
											fontSize: 10,
											padding: '1px 5px',
											borderRadius: 10,
										} }>
											{ pathMap.get( node.pathId )!.label || `Path #${ node.pathId }` }
										</span>
									) }
								</td>
								<td>
									{ node.substoryId ? (
										node.substoryEditUrl ? (
											<a href={ node.substoryEditUrl } target="_blank" rel="noopener">
												{ node.substoryTitle || `Substory #${ node.substoryId }` } ↗
											</a>
										) : (
											<span>{ node.substoryTitle || `Substory #${ node.substoryId }` }</span>
										)
									) : (
										<span className="description">—</span>
									) }
								</td>
								<td>
									{ outEdges.length === 0 && <span className="description">None</span> }
									{ outEdges.map( ( edge ) => {
										const toNode = nodes.find( ( n ) => n.id === edge.toNodeId );
										return (
											<div key={ edge.id } className="cns-edge-row">
												<NumberControl
													size="small"
													label={ __( 'Sort order (lower = higher priority)', 'cns-story-suite' ) }
													hideLabelFromVision
													min={ 0 }
													value={ edge.sortOrder }
													onChange={ ( v ) => onEdgeReorder( edge.id, parseInt( v ?? '', 10 ) || 0 ) }
													style={ { width: 60 } }
												/>
												<span>→ { toNode ? getDisplayTitle( toNode ) : `#${ edge.toNodeId }` }</span>
												<Button
													size="small"
													icon={ brush }
													label={ __( 'Style this connection', 'cns-story-suite' ) }
													onClick={ () => onEditEdge( edge.id ) }
												/>
												<Button
													size="small"
													icon={ closeSmall }
													isDestructive
													label={ __( 'Delete connection', 'cns-story-suite' ) }
													onClick={ () => {
														if ( window.confirm( 'Delete this connection?' ) ) onEdgeDelete( edge.id );
													} }
												/>
											</div>
										);
									} ) }
								</td>
								<td className="cns-maps-actions">
									<div className="cns-actions-row">
										{ node.id !== startNodeId && (
											<Button
												size="small"
												icon={ starEmpty }
												label={ __( 'Set as start node', 'cns-story-suite' ) }
												onClick={ () => onSetStartNode( node.id ) }
											>
												{ __( 'Set Start', 'cns-story-suite' ) }
											</Button>
										) }
										<Button
											size="small"
											icon={ pencil }
											label={ __( 'Edit', 'cns-story-suite' ) }
											onClick={ () => onEditNode( node.id ) }
										/>
										<Button
											size="small"
											icon={ trash }
											isDestructive
											label={ __( 'Delete', 'cns-story-suite' ) }
											onClick={ () => {
												if ( window.confirm( 'Delete this node and all its connections?' ) ) {
													onDeleteNode( node.id );
												}
											} }
										/>
									</div>
								</td>
							</tr>
						);
					} ) }
				</tbody>
			</table>
		</div>
	);
}
