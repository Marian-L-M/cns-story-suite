import type { StoryNode, StoryEdge } from '../../types';

interface Props {
	nodes:             StoryNode[];
	edges:             StoryEdge[];
	currentNodeId:     number | null;
	onNavigate:        ( nodeId: number ) => void;
	isAdmin?:          boolean;
	substoryBaseUrl?:  string;
	onEditNode?:       ( nodeId: number ) => void;
	onDeleteNode?:     ( nodeId: number ) => void;
}

function getDisplayTitle( node: StoryNode ): string {
	return node.titleOverride || node.substoryTitle || `Node #${ node.id }`;
}

function getDisplayExcerpt( node: StoryNode ): string {
	return node.excerptOverride || node.substoryExcerpt || '';
}

export default function StoryWindow( {
	nodes, edges, currentNodeId, onNavigate,
	isAdmin = false, substoryBaseUrl, onEditNode, onDeleteNode,
}: Props ) {
	const currentNode = nodes.find( ( n ) => n.id === currentNodeId ) ?? null;

	// Nodes with edges pointing TO current.
	const prevNodes = edges
		.filter( ( e ) => e.toNodeId === currentNodeId )
		.sort( ( a, b ) => a.sortOrder - b.sortOrder )
		.map( ( e ) => nodes.find( ( n ) => n.id === e.fromNodeId ) )
		.filter( ( n ): n is StoryNode => n !== undefined );

	// Nodes that current has edges TO (all branches).
	const nextNodes = edges
		.filter( ( e ) => e.fromNodeId === currentNodeId )
		.sort( ( a, b ) => a.sortOrder - b.sortOrder )
		.map( ( e ) => nodes.find( ( n ) => n.id === e.toNodeId ) )
		.filter( ( n ): n is StoryNode => n !== undefined );

	return (
		<div className="cns-story-window">
			<div className="cns-story-window__inner">

				{ /* Previous navigation */ }
				<div className="cns-story-window__nav cns-story-window__nav--prev">
					{ prevNodes.map( ( n ) => (
						<button
							key={ n.id }
							className="cns-story-window__nav-btn"
							onClick={ () => onNavigate( n.id ) }
							title={ getDisplayTitle( n ) }
						>
							← { getDisplayTitle( n ) }
						</button>
					) ) }
				</div>

				{ /* Current node content */ }
				<div className="cns-story-window__content-area">
					{ currentNode ? (
						<div className="cns-story-window__card">
							{ currentNode.substoryThumbnailUrl && (
								<img
									src={ currentNode.substoryThumbnailUrl }
									alt={ getDisplayTitle( currentNode ) }
									className="cns-story-window__thumb"
								/>
							) }
							<div className="cns-story-window__card-body">
								<h3 className="cns-story-window__node-title">
									{ getDisplayTitle( currentNode ) }
								</h3>
								{ getDisplayExcerpt( currentNode ) && (
									<p className="cns-story-window__excerpt">
										{ getDisplayExcerpt( currentNode ) }
									</p>
								) }
								{ ! isAdmin && currentNode.substoryUrl && (
									<a
										href={ currentNode.substoryUrl }
										className="cns-story-window__read-more"
									>
										Read more →
									</a>
								) }
								{ isAdmin && (
									<div className="cns-story-window__admin-actions">
										{ onEditNode && (
											<button
												className="button button-small"
												onClick={ () => onEditNode( currentNode.id ) }
											>
												Edit Node
											</button>
										) }
										{ currentNode.substoryEditUrl && (
											<a
												href={ currentNode.substoryEditUrl }
												target="_blank"
												rel="noopener"
												className="button button-small"
											>
												Edit Post ↗
											</a>
										) }
										{ ! currentNode.substoryId && substoryBaseUrl && (
											<a
												href={ substoryBaseUrl }
												target="_blank"
												rel="noopener"
												className="button button-small"
											>
												New Substory ↗
											</a>
										) }
										{ onDeleteNode && (
											<button
												className="button button-small cns-delete-link"
												onClick={ () => {
													if ( window.confirm( 'Remove this node from the story?' ) ) {
														onDeleteNode( currentNode.id );
													}
												} }
											>
												Remove Node
											</button>
										) }
									</div>
								) }
							</div>
						</div>
					) : (
						<div className="cns-story-window__empty">
							{ nodes.length === 0
								? 'Click on the canvas to add your first story node.'
								: 'Click a node on the canvas to preview it here.'
							}
						</div>
					) }
				</div>

				{ /* Next / branch navigation */ }
				<div className="cns-story-window__nav cns-story-window__nav--next">
					{ nextNodes.length === 0 && currentNode && (
						<span className="cns-story-window__end-label">End of path</span>
					) }
					{ nextNodes.map( ( n ) => (
						<button
							key={ n.id }
							className="cns-story-window__nav-btn"
							onClick={ () => onNavigate( n.id ) }
							title={ getDisplayTitle( n ) }
						>
							{ getDisplayTitle( n ) } →
						</button>
					) ) }
				</div>

			</div>
		</div>
	);
}
