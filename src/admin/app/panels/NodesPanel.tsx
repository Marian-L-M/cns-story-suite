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
									{ outEdges.map( ( edge, i ) => {
										const toNode = nodes.find( ( n ) => n.id === edge.toNodeId );
										return (
											<div key={ edge.id } className="cns-edge-row">
												<input
													type="number"
													min="0"
													value={ edge.sortOrder }
													onChange={ ( e ) => onEdgeReorder( edge.id, parseInt( e.target.value ) ) }
													style={ { width: 44 } }
													title="Sort order (lower = higher priority)"
												/>
												<span>→ { toNode ? getDisplayTitle( toNode ) : `#${ edge.toNodeId }` }</span>
												<button
													className="cns-icon-btn"
													title="Style this connection"
													onClick={ () => onEditEdge( edge.id ) }
												>&#x2261;</button>
												<button
													className="cns-icon-btn"
													title="Delete connection"
													onClick={ () => {
														if ( window.confirm( 'Delete this connection?' ) ) onEdgeDelete( edge.id );
													} }
												>
													✕
												</button>
											</div>
										);
									} ) }
								</td>
								<td className="cns-maps-actions">
									{ node.id !== startNodeId && (
										<button
											className="button button-small"
											onClick={ () => onSetStartNode( node.id ) }
										>
											Set Start
										</button>
									) }
									{ ' ' }
									<button
										className="button button-small"
										onClick={ () => onEditNode( node.id ) }
									>
										Edit
									</button>
									{ ' ' }
									<button
										className="button button-small cns-delete-link"
										onClick={ () => {
											if ( window.confirm( 'Delete this node and all its connections?' ) ) {
												onDeleteNode( node.id );
											}
										} }
									>
										Delete
									</button>
								</td>
							</tr>
						);
					} ) }
				</tbody>
			</table>
		</div>
	);
}
