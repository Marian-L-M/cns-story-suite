import { useState } from '@wordpress/element';
import { Button, ComboboxControl, Flex, Modal } from '@wordpress/components';
import { arrowDown, arrowUp, closeSmall } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import SubstoryPicker from '../shared/SubstoryPicker';
import type { StoryNode, StoryEdge, StoryPath } from '../../../types';

interface Props {
	path:  StoryPath;
	nodes: StoryNode[];
	edges: StoryEdge[];
	/** Creates a node (canvas centre) for a substory, already assigned to the path. */
	onQuickNodeCreate: ( substoryId: number, pathId: number ) => Promise< StoryNode | undefined >;
	/** Applies membership + linear connection order. */
	onApply: ( pathId: number, orderedNodeIds: number[], removedNodeIds: number[] ) => Promise< void >;
	onClose: () => void;
}

function getDisplayTitle( node: StoryNode ): string {
	return node.titleOverride || node.substoryTitle || `Node #${ node.id }`;
}

/**
 * Initial sequence for the path's nodes: follow existing connections between
 * path members (branch order = edge sort order), starting from members without
 * an incoming member connection; unconnected members are appended last.
 */
function deriveOrder( members: StoryNode[], edges: StoryEdge[] ): number[] {
	const memberIds = new Set( members.map( ( m ) => m.id ) );
	const inDegree  = new Map( members.map( ( m ) => [ m.id, 0 ] ) );
	for ( const e of edges ) {
		if ( memberIds.has( e.fromNodeId ) && memberIds.has( e.toNodeId ) ) {
			inDegree.set( e.toNodeId, ( inDegree.get( e.toNodeId ) ?? 0 ) + 1 );
		}
	}

	const visited = new Set< number >();
	const order: number[] = [];
	function visit( id: number ) {
		if ( visited.has( id ) ) return;
		visited.add( id );
		order.push( id );
		edges
			.filter( ( e ) => e.fromNodeId === id && memberIds.has( e.toNodeId ) )
			.sort( ( a, b ) => a.sortOrder - b.sortOrder || a.id - b.id )
			.forEach( ( e ) => visit( e.toNodeId ) );
	}

	for ( const m of members ) {
		if ( ( inDegree.get( m.id ) ?? 0 ) === 0 ) visit( m.id );
	}
	for ( const m of members ) visit( m.id ); // cycles / leftovers

	return order;
}

export default function PathNodesModal( { path, nodes, edges, onQuickNodeCreate, onApply, onClose }: Props ) {
	const [ orderedIds, setOrderedIds ] = useState< number[] >( () =>
		deriveOrder( nodes.filter( ( n ) => n.pathId === path.id ), edges )
	);
	const [ initialIds ] = useState< number[] >( () => [ ...orderedIds ] );
	const [ applying, setApplying ] = useState( false );
	const [ addingSubstory, setAddingSubstory ] = useState( false );

	const nodeMap = new Map( nodes.map( ( n ) => [ n.id, n ] ) );

	function move( index: number, dir: -1 | 1 ) {
		const target = index + dir;
		if ( target < 0 || target >= orderedIds.length ) return;
		setOrderedIds( ( p ) => {
			const next = [ ...p ];
			[ next[ index ], next[ target ] ] = [ next[ target ], next[ index ] ];
			return next;
		} );
	}

	// Story nodes not currently in the list — candidates for "add existing".
	const available = nodes.filter( ( n ) => ! orderedIds.includes( n.id ) );

	async function handleAddSubstory( substoryId: number | null ) {
		if ( ! substoryId ) return;
		setAddingSubstory( true );
		const node = await onQuickNodeCreate( substoryId, path.id );
		if ( node ) setOrderedIds( ( p ) => [ ...p, node.id ] );
		setAddingSubstory( false );
	}

	async function handleApply() {
		setApplying( true );
		const removed = initialIds.filter( ( id ) => ! orderedIds.includes( id ) );
		await onApply( path.id, orderedIds, removed );
		setApplying( false );
		onClose();
	}

	return (
		<Modal
			title={ sprintf(
				/* translators: %s: path label */
				__( 'Manage Nodes — %s', 'cns-story-suite' ),
				path.label || `Path #${ path.id }`
			) }
			onRequestClose={ onClose }
			size="medium"
		>
			<p className="description" style={ { marginTop: 0 } }>
				{ __(
					'Nodes are connected top-to-bottom in the order below. Applying replaces the connections between these nodes; connections to nodes outside the list are kept.',
					'cns-story-suite'
				) }
			</p>

			<div className="cns-path-nodes-list">
				{ orderedIds.length === 0 && (
					<p className="description">{ __( 'No nodes in this path yet.', 'cns-story-suite' ) }</p>
				) }
				{ orderedIds.map( ( id, index ) => {
					const node = nodeMap.get( id );
					if ( ! node ) return null;
					return (
						<div key={ id } className="cns-path-nodes-list__item">
							<span className="cns-path-nodes-list__index">{ index + 1 }.</span>
							<span
								className="cns-node-swatch"
								style={ {
									background:   node.iconType === 'thumbnail' || node.iconType === 'icon' ? 'transparent' : node.iconColor,
									borderRadius: node.iconType === 'square' || node.iconType === 'diamond' ? 2 : '50%',
									transform:    node.iconType === 'diamond' ? 'rotate(45deg)' : undefined,
									border: '1px solid rgba(0,0,0,0.3)',
								} }
							/>
							<span className="cns-path-nodes-list__title">{ getDisplayTitle( node ) }</span>
							<Button
								size="small"
								icon={ arrowUp }
								label={ __( 'Move up', 'cns-story-suite' ) }
								disabled={ index === 0 }
								onClick={ () => move( index, -1 ) }
							/>
							<Button
								size="small"
								icon={ arrowDown }
								label={ __( 'Move down', 'cns-story-suite' ) }
								disabled={ index === orderedIds.length - 1 }
								onClick={ () => move( index, 1 ) }
							/>
							<Button
								size="small"
								icon={ closeSmall }
								isDestructive
								label={ __( 'Remove from this path', 'cns-story-suite' ) }
								onClick={ () => setOrderedIds( ( p ) => p.filter( ( x ) => x !== id ) ) }
							/>
						</div>
					);
				} ) }
			</div>

			<div className="cns-modal-section">
				<h3>{ __( 'Add existing node', 'cns-story-suite' ) }</h3>
				<ComboboxControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Add existing node', 'cns-story-suite' ) }
					hideLabelFromVision
					placeholder={ __( 'Search this story’s nodes…', 'cns-story-suite' ) }
					value={ null }
					options={ available.map( ( n ) => ( {
						value: String( n.id ),
						label: n.pathId
							? `${ getDisplayTitle( n ) } (${ __( 'currently in another path', 'cns-story-suite' ) })`
							: getDisplayTitle( n ),
					} ) ) }
					onChange={ ( value ) => {
						const id = parseInt( value ?? '', 10 );
						if ( id ) setOrderedIds( ( p ) => [ ...p, id ] );
					} }
				/>
			</div>

			<div className="cns-modal-section">
				<h3>{ __( 'Add substory as new node', 'cns-story-suite' ) }</h3>
				<p className="description" style={ { marginBottom: 6 } }>
					{ __( 'Creates a node at the canvas centre linked to the chosen substory — move it into place on the Canvas tab afterwards.', 'cns-story-suite' ) }
				</p>
				<SubstoryPicker
					substoryId={ null }
					substoryLabel=""
					onChange={ ( id ) => handleAddSubstory( id ) }
				/>
				{ addingSubstory && <p className="description">{ __( 'Adding…', 'cns-story-suite' ) }</p> }
			</div>

			<Flex justify="flex-end" gap={ 2 } style={ { marginTop: 16 } }>
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel', 'cns-story-suite' ) }
				</Button>
				<Button
					variant="primary"
					isBusy={ applying }
					disabled={ applying }
					onClick={ handleApply }
				>
					{ applying
						? __( 'Applying…', 'cns-story-suite' )
						: __( 'Apply Order & Connections', 'cns-story-suite' ) }
				</Button>
			</Flex>
		</Modal>
	);
}
