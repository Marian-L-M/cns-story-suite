import { Button } from '@wordpress/components';
import { arrowDown, arrowUp, brush, linkOff, pencil, plusCircle, starFilled, trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
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
	onEditEdge:      ( edgeId: number ) => void;
}

function formatStep( num: number[] | null ): string {
	return num === null ? '—' : num.join( '.' );
}

/**
 * Numbering rules
 * ───────────────
 * • Each component root (startNodeId, then other in-degree-0 nodes in creation order) is unnumbered.
 * • Roots are assigned consecutive top-level sections: root 1 uses section 1, root 2 uses section 2, …
 *   (a root with N branches uses N sections; a root with 0 or 1 child uses exactly 1 section)
 * • Direct children of a root → [section, 1], [section+1, 1] … for multiple branches.
 * • Linear continuation: [s,1] → [s,2] → [s,3]; after a branch: append 1 → [s,2,1]
 * • Branching (≥2 outgoing): each child i → [...parent, i+1], fromBranch=true
 */
function buildTree(
	nodes:       StoryNode[],
	edges:       StoryEdge[],
	startNodeId: number | null,
): TreeItem[] {
	const result        = [] as TreeItem[];
	const visited       = new Set< number >();
	const stepNums      = new Map< number, number[] >();
	const fromBranchOf  = new Map< number, boolean >();

	const startId = startNodeId ?? nodes[ 0 ]?.id ?? null;

	// Reachable set from a given node (DFS).
	function computeReachable( fromId: number ): Set< number > {
		const r = new Set< number >();
		function dfs( id: number ) {
			if ( r.has( id ) ) return;
			r.add( id );
			for ( const e of edges ) { if ( e.fromNodeId === id ) dfs( e.toNodeId ); }
		}
		dfs( fromId );
		return r;
	}

	// In-degree map (for finding component roots).
	const inDegree = new Map< number, number >();
	for ( const n of nodes ) inDegree.set( n.id, 0 );
	for ( const e of edges ) inDegree.set( e.toNodeId, ( inDegree.get( e.toNodeId ) ?? 0 ) + 1 );

	// Component roots: startId first, then any other in-degree-0 nodes (in node order = creation ASC).
	const roots: number[] = [];
	if ( startId !== null ) roots.push( startId );
	for ( const n of nodes ) {
		if ( n.id !== startId && inDegree.get( n.id ) === 0 ) roots.push( n.id );
	}

	// Global top-level section counter; increments as component roots are processed.
	let nextSection = 1;

	for ( const rootId of roots ) {
		const reachable = computeReachable( rootId );

		function assignChildNumbers(
			nodeId:     number,
			parentNum:  number[] | null,
			fromBranch: boolean,
			isRoot:     boolean,
		) {
			const out = edges
				.filter( ( e ) => e.fromNodeId === nodeId && reachable.has( e.toNodeId ) )
				.sort( ( a, b ) => a.sortOrder - b.sortOrder );

			if ( isRoot ) {
				const used = Math.max( 1, out.length );
				out.forEach( ( edge, i ) => {
					if ( ! stepNums.has( edge.toNodeId ) ) {
						stepNums.set( edge.toNodeId, [ nextSection + i, 1 ] );
						fromBranchOf.set( edge.toNodeId, false );
					}
				} );
				nextSection += used;
			} else if ( parentNum !== null ) {
				if ( out.length === 1 ) {
					const childId = out[ 0 ].toNodeId;
					if ( ! stepNums.has( childId ) ) {
						const childNum = fromBranch
							? [ ...parentNum, 1 ]
							: [ ...parentNum.slice( 0, -1 ), parentNum[ parentNum.length - 1 ] + 1 ];
						stepNums.set( childId, childNum );
						fromBranchOf.set( childId, false );
					}
				} else if ( out.length > 1 ) {
					out.forEach( ( edge, i ) => {
						if ( ! stepNums.has( edge.toNodeId ) ) {
							stepNums.set( edge.toNodeId, [ ...parentNum, i + 1 ] );
							fromBranchOf.set( edge.toNodeId, true );
						}
					} );
				}
			}
		}

		function visit(
			nodeId:       number,
			incomingEdge: StoryEdge | null,
			siblings:     StoryEdge[],
			depth:        number,
			isRoot:       boolean,
		) {
			if ( visited.has( nodeId ) ) return;
			visited.add( nodeId );

			const node = nodes.find( ( n ) => n.id === nodeId );
			if ( ! node ) return;

			const stepNumber = isRoot ? null : ( stepNums.get( nodeId ) ?? null );
			result.push( { node, incomingEdge, siblings, depth, stepNumber } );

			const outEdges = edges
				.filter( ( e ) => e.fromNodeId === nodeId && reachable.has( e.toNodeId ) )
				.sort( ( a, b ) => a.sortOrder - b.sortOrder );

			assignChildNumbers( nodeId, stepNumber, fromBranchOf.get( nodeId ) ?? false, isRoot );

			for ( const edge of outEdges ) {
				visit( edge.toNodeId, edge, outEdges, depth + 1, false );
			}
		}

		visit( rootId, null, [], 0, true );
	}

	// Nodes not reached from any root (cycles / unreachable) — show without numbers.
	for ( const node of nodes ) {
		if ( ! visited.has( node.id ) ) {
			result.push( { node, incomingEdge: null, siblings: [], depth: 0, stepNumber: null } );
			visited.add( node.id );
		}
	}

	return result;
}

function getDisplayTitle( node: StoryNode ): string {
	return node.titleOverride || node.substoryTitle || `Node #${ node.id }`;
}

export default function CanvasNodeList( {
	nodes, edges, startNodeId, selectedNodeId,
	onSelect, onEdit, onDelete, onSetStartNode,
	onEdgeReorder, onEdgeDelete, onStartEdgeFrom, onEditEdge,
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
						{ node.iconType === 'thumbnail' && node.substoryThumbnailUrl ? (
							<img
								src={ node.substoryThumbnailUrl }
								alt=""
								className="cns-node-swatch"
								style={ { borderRadius: '50%', objectFit: 'cover' } }
							/>
						) : (
							<span
								className="cns-node-swatch"
								style={ {
									background:   node.iconColor,
									borderRadius: node.iconType === 'square' ? 2
									            : node.iconType === 'diamond' ? 0
									            : '50%',
									transform:    node.iconType === 'diamond' ? 'rotate(45deg)' : undefined,
								} }
							/>
						) }
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
									<Button
										size="small"
										icon={ arrowUp }
										label={ __( 'Move up in sequence', 'cns-story-suite' ) }
										disabled={ ! canUp }
										onClick={ () => handleMoveUp( item ) }
									/>
									<Button
										size="small"
										icon={ arrowDown }
										label={ __( 'Move down in sequence', 'cns-story-suite' ) }
										disabled={ ! canDown }
										onClick={ () => handleMoveDown( item ) }
									/>
									<Button
										size="small"
										icon={ brush }
										label={ __( 'Style this connection', 'cns-story-suite' ) }
										onClick={ () => onEditEdge( incomingEdge.id ) }
									/>
									<Button
										size="small"
										icon={ linkOff }
										label={ __( 'Remove this branch', 'cns-story-suite' ) }
										onClick={ () => {
											if ( window.confirm( 'Remove the connection to this node?' ) ) {
												onEdgeDelete( incomingEdge.id );
											}
										} }
									/>
									<Button
										size="small"
										icon={ plusCircle }
										label={ __( 'Split route: add a parallel branch from the same parent', 'cns-story-suite' ) }
										onClick={ () => onStartEdgeFrom( incomingEdge.fromNodeId ) }
									/>
								</>
							) }
							{ ! incomingEdge && ! isStart && (
								<Button
									size="small"
									icon={ starFilled }
									label={ __( 'Set as start node', 'cns-story-suite' ) }
									onClick={ () => onSetStartNode( node.id ) }
								/>
							) }
							<Button
								size="small"
								icon={ pencil }
								label={ __( 'Edit node', 'cns-story-suite' ) }
								onClick={ () => onEdit( node.id ) }
							/>
							<Button
								size="small"
								icon={ trash }
								isDestructive
								label={ __( 'Delete node', 'cns-story-suite' ) }
								onClick={ () => {
									if ( window.confirm( 'Delete this node and all its connections?' ) ) {
										onDelete( node.id );
									}
								} }
							/>
						</div>
					</div>
				);
			} ) }
		</div>
	);
}
