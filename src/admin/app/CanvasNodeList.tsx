import type { StoryNode, StoryEdge } from '../../types';

interface TreeItem {
	node:         StoryNode;
	incomingEdge: StoryEdge | null;
	siblings:     StoryEdge[];
	depth:        number;
	stepNumber:   number[] | null; // e.g. [1,2,1] → "1.2.1"; null = orphan / root
}

interface Props {
	nodes:           StoryNode[];
	edges:           StoryEdge[];
	startNodeId:     number | null;
	selectedNodeId:  number | null;
	onSelect:        ( nodeId: number ) => void;
	onEdit:          ( nodeId: number ) => void;
	onDelete:        ( nodeId: number ) => void;
	onSetStartNode:  ( nodeId: number ) => void;
	onEdgeReorder:   ( edgeId: number, sortOrder: number ) => void;
	onEdgeDelete:    ( edgeId: number ) => void;
	onStartEdgeFrom: ( fromNodeId: number ) => void;
}

function formatStep( num: number[] | null ): string {
	return num === null ? '—' : num.join( '.' );
}

/**
 * Numbering rules
 * ───────────────
 * • The start (root) node is unnumbered.
 * • Each direct child of root starts a new top-level path: child 1 → [1,1], child 2 → [2,1] …
 * • Linear continuation (parent has exactly 1 outgoing edge):
 *     – if the parent's number was assigned via branching (fromBranch=true): append 1   → [1,2,1] → [1,2,1,1]
 *     – otherwise increment the last segment                               → [1,1] → [1,2] → [1,3]
 * • Branching (parent has ≥2 outgoing edges): each child i → [...parent, i+1], fromBranch=true
 */
function buildTree(
	nodes:       StoryNode[],
	edges:       StoryEdge[],
	startNodeId: number | null,
): TreeItem[] {
	const result:        TreeItem[]           = [];
	const visited      = new Set< number >();
	const reachable    = new Set< number >();
	const stepNums     = new Map< number, number[] >();
	const fromBranchOf = new Map< number, boolean >();

	// Flood-fill reachability from start
	function markReachable( id: number ) {
		if ( reachable.has( id ) ) return;
		reachable.add( id );
		for ( const e of edges ) {
			if ( e.fromNodeId === id ) markReachable( e.toNodeId );
		}
	}

	const startId = startNodeId ?? nodes[ 0 ]?.id ?? null;
	if ( startId !== null ) markReachable( startId );

	function assignChildNumbers(
		nodeId:     number,
		parentNum:  number[] | null,
		fromBranch: boolean,
		isRoot:     boolean,
	) {
		const out = edges
			.filter( ( e ) => e.fromNodeId === nodeId )
			.sort( ( a, b ) => a.sortOrder - b.sortOrder );

		if ( isRoot ) {
			// Root's children each start a new path [pathIndex, 1]
			out.forEach( ( edge, i ) => {
				if ( reachable.has( edge.toNodeId ) && ! stepNums.has( edge.toNodeId ) ) {
					stepNums.set( edge.toNodeId, [ i + 1, 1 ] );
					fromBranchOf.set( edge.toNodeId, false );
				}
			} );
		} else if ( parentNum !== null ) {
			if ( out.length === 1 ) {
				const childId = out[ 0 ].toNodeId;
				if ( reachable.has( childId ) && ! stepNums.has( childId ) ) {
					const childNum = fromBranch
						? [ ...parentNum, 1 ]
						: [ ...parentNum.slice( 0, -1 ), parentNum[ parentNum.length - 1 ] + 1 ];
					stepNums.set( childId, childNum );
					fromBranchOf.set( childId, false );
				}
			} else if ( out.length > 1 ) {
				out.forEach( ( edge, i ) => {
					if ( reachable.has( edge.toNodeId ) && ! stepNums.has( edge.toNodeId ) ) {
						stepNums.set( edge.toNodeId, [ ...parentNum, i + 1 ] );
						fromBranchOf.set( edge.toNodeId, true );
					}
				} );
			}
		}
	}

	function visit(
		nodeId:      number,
		incomingEdge: StoryEdge | null,
		siblings:    StoryEdge[],
		depth:       number,
		isRoot:      boolean,
	) {
		if ( visited.has( nodeId ) ) return;
		visited.add( nodeId );

		const node = nodes.find( ( n ) => n.id === nodeId );
		if ( ! node ) return;

		const stepNumber = ( ! isRoot && reachable.has( nodeId ) )
			? ( stepNums.get( nodeId ) ?? null )
			: null;

		result.push( { node, incomingEdge, siblings, depth, stepNumber } );

		const outEdges = edges
			.filter( ( e ) => e.fromNodeId === nodeId )
			.sort( ( a, b ) => a.sortOrder - b.sortOrder );

		// Assign numbers to direct children before descending
		assignChildNumbers( nodeId, stepNumber, fromBranchOf.get( nodeId ) ?? false, isRoot );

		for ( const edge of outEdges ) {
			visit( edge.toNodeId, edge, outEdges, depth + 1, false );
		}
	}

	if ( startId !== null ) visit( startId, null, [], 0, true );
	// Orphaned nodes (not reachable from start)
	for ( const node of nodes ) {
		if ( ! visited.has( node.id ) ) visit( node.id, null, [], 0, false );
	}

	return result;
}

function getDisplayTitle( node: StoryNode ): string {
	return node.titleOverride || node.substoryTitle || `Node #${ node.id }`;
}

export default function CanvasNodeList( {
	nodes, edges, startNodeId, selectedNodeId,
	onSelect, onEdit, onDelete, onSetStartNode,
	onEdgeReorder, onEdgeDelete, onStartEdgeFrom,
}: Props ) {
	if ( ! nodes.length ) {
		return (
			<div className="cns-canvas-node-list cns-canvas-node-list--empty">
				<p className="description">Click on the canvas to add your first node.</p>
			</div>
		);
	}

	const tree = buildTree( nodes, edges, startNodeId );

	function handleMoveUp( item: TreeItem ) {
		const { incomingEdge, siblings } = item;
		if ( ! incomingEdge ) return;
		const sorted = [ ...siblings ].sort( ( a, b ) => a.sortOrder - b.sortOrder );
		const idx    = sorted.findIndex( ( e ) => e.id === incomingEdge.id );
		if ( idx <= 0 ) return;
		const prev = sorted[ idx - 1 ];
		onEdgeReorder( incomingEdge.id, prev.sortOrder );
		onEdgeReorder( prev.id, incomingEdge.sortOrder );
	}

	function handleMoveDown( item: TreeItem ) {
		const { incomingEdge, siblings } = item;
		if ( ! incomingEdge ) return;
		const sorted = [ ...siblings ].sort( ( a, b ) => a.sortOrder - b.sortOrder );
		const idx    = sorted.findIndex( ( e ) => e.id === incomingEdge.id );
		if ( idx < 0 || idx >= sorted.length - 1 ) return;
		const next = sorted[ idx + 1 ];
		onEdgeReorder( incomingEdge.id, next.sortOrder );
		onEdgeReorder( next.id, incomingEdge.sortOrder );
	}

	return (
		<div className="cns-canvas-node-list">
			<div className="cns-canvas-node-list__header">Nodes</div>
			{ tree.map( ( item ) => {
				const { node, incomingEdge, siblings, depth, stepNumber } = item;
				const isStart    = node.id === startNodeId;
				const isSelected = node.id === selectedNodeId;
				const isOrphan   = stepNumber === null && ! isStart;

				const sorted = [ ...siblings ].sort( ( a, b ) => a.sortOrder - b.sortOrder );
				const idx    = sorted.findIndex( ( e ) => e.id === incomingEdge?.id );
				const canUp   = incomingEdge !== null && idx > 0;
				const canDown = incomingEdge !== null && idx < sorted.length - 1;

				return (
					<div
						key={ node.id }
						className={ [
							'cns-canvas-node-list__item',
							isSelected ? 'is-selected' : '',
							isOrphan   ? 'is-orphan'   : '',
						].filter( Boolean ).join( ' ' ) }
						style={ { paddingLeft: 8 + Math.min( depth, 4 ) * 14 } }
					>
						{ incomingEdge && <span className="cns-canvas-node-list__connector">└</span> }
						<span className="cns-canvas-node-list__step">
							{ isStart ? '★' : formatStep( stepNumber ) }
						</span>
						<span
							className="cns-node-swatch"
							style={ {
								background:   node.iconColor,
								borderRadius: node.iconType === 'square' ? 2 : '50%',
							} }
						/>
						<button
							className="cns-canvas-node-list__title"
							onClick={ () => onSelect( node.id ) }
							title="Select on canvas"
						>
							{ getDisplayTitle( node ) }
						</button>

						<div className="cns-canvas-node-list__actions">
							{ incomingEdge && (
								<>
									<button
										className="cns-icon-btn"
										title="Move up in sequence"
										disabled={ ! canUp }
										onClick={ () => handleMoveUp( item ) }
									>↑</button>
									<button
										className="cns-icon-btn"
										title="Move down in sequence"
										disabled={ ! canDown }
										onClick={ () => handleMoveDown( item ) }
									>↓</button>
									<button
										className="cns-icon-btn"
										title="Remove this branch"
										onClick={ () => {
											if ( window.confirm( 'Remove the connection to this node?' ) ) {
												onEdgeDelete( incomingEdge.id );
											}
										} }
									>←</button>
									<button
										className="cns-icon-btn"
										title="Split route: add a parallel branch from the same parent"
										onClick={ () => onStartEdgeFrom( incomingEdge.fromNodeId ) }
									>→</button>
								</>
							) }
							{ ! incomingEdge && ! isStart && (
								<button
									className="cns-icon-btn"
									title="Set as start node"
									onClick={ () => onSetStartNode( node.id ) }
								>★</button>
							) }
							<button
								className="cns-icon-btn"
								title="Edit node"
								onClick={ () => onEdit( node.id ) }
							>✎</button>
							<button
								className="cns-icon-btn cns-icon-btn--danger"
								title="Delete node"
								onClick={ () => {
									if ( window.confirm( 'Delete this node and all its connections?' ) ) {
										onDelete( node.id );
									}
								} }
							>✕</button>
						</div>
					</div>
				);
			} ) }
		</div>
	);
}
