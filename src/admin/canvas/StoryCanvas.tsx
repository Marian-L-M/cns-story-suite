import { useRef, useEffect, useCallback } from '@wordpress/element';
import { drawStory, drawPendingEdge, getNodeAtPoint, getEdgeAtPoint, preloadImages } from './canvas';
import type { StoryNode, StoryEdge, StoryPath, MapRenderData, MapObjectRef, MapAreaRef, LineStyle, MarkerType } from '../../types';

interface Props {
	mapData:           MapRenderData | null;
	mapObjects:        MapObjectRef[];
	mapAreas:          MapAreaRef[];
	nodes:             StoryNode[];
	edges:             StoryEdge[];
	paths:             StoryPath[];
	selectedNodeId:    number | null;
	edgeStartNodeId:   number | null;
	isEdgeMode:        boolean;
	lineColor:         string;
	lineWidth:         number;
	lineStyle:         LineStyle;
	lineOpacity:       number;
	markerColor:       string;
	markerSize:        number;
	markerType:        MarkerType;
	markerIconUrl:     string;
	markerIconOffsetX: number;
	markerIconOffsetY: number;
	onNodeClick:       ( nodeId: number ) => void;
	onCanvasClick:     ( x: number, y: number ) => void;
	onEdgeClick:       ( edgeId: number ) => void;
	onNodeDragEnd:     ( nodeId: number, x: number, y: number ) => void;
}

export default function StoryCanvas( {
	mapData, mapObjects, mapAreas,
	nodes, edges, paths,
	selectedNodeId, edgeStartNodeId, isEdgeMode,
	lineColor, lineWidth, lineStyle, lineOpacity,
	markerColor, markerSize, markerType, markerIconUrl, markerIconOffsetX, markerIconOffsetY,
	onNodeClick, onCanvasClick, onEdgeClick, onNodeDragEnd,
}: Props ) {
	const canvasRef  = useRef< HTMLCanvasElement >( null );
	const stateRef   = useRef( {
		mapData, mapObjects, mapAreas, nodes, edges, paths,
		selectedNodeId, edgeStartNodeId, isEdgeMode,
		lineColor, lineWidth, lineStyle, lineOpacity,
		markerColor, markerSize, markerType, markerIconUrl, markerIconOffsetX, markerIconOffsetY,
	} );
	const dragging   = useRef< { nodeId: number; startX: number; startY: number } | null >( null );
	const mousePos   = useRef< { x: number; y: number } | null >( null );
	const animFrame  = useRef< number >( 0 );

	const canvasW = mapData?.width        ?? 900;
	const canvasH = mapData ? Math.round( mapData.width * mapData.aspectRatio ) : 600;

	// Keep stateRef current and sync cursor whenever isEdgeMode changes.
	useEffect( () => {
		stateRef.current = {
			mapData, mapObjects, mapAreas, nodes, edges, paths,
			selectedNodeId, edgeStartNodeId, isEdgeMode,
			lineColor, lineWidth, lineStyle, lineOpacity,
			markerColor, markerSize, markerType, markerIconUrl, markerIconOffsetX, markerIconOffsetY,
		};
		if ( canvasRef.current && ! dragging.current ) {
			canvasRef.current.style.cursor = isEdgeMode ? 'crosshair' : 'default';
		}
	} );

	// Preload all image URLs.
	useEffect( () => {
		const urls: string[] = [];
		if ( mapData?.bgImageUrl )  urls.push( mapData.bgImageUrl );
		if ( mapData?.imageUrl )    urls.push( mapData.imageUrl );
		mapObjects.forEach( ( o ) => { if ( o.iconUrl ) urls.push( o.iconUrl ); } );
		nodes.forEach( ( n ) => {
			if ( n.iconUrl )         urls.push( n.iconUrl );
			if ( n.markerIconUrl )   urls.push( n.markerIconUrl );
		} );
		paths.forEach( ( p ) => { if ( p.markerIconUrl ) urls.push( p.markerIconUrl ); } );
		if ( markerIconUrl ) urls.push( markerIconUrl );
		preloadImages( urls );
	}, [ mapData, mapObjects, nodes, paths, markerIconUrl ] );

	// Render loop.
	const render = useCallback( () => {
		const canvas = canvasRef.current;
		if ( ! canvas ) return;
		const ctx = canvas.getContext( '2d' );
		if ( ! ctx ) return;
		const s = stateRef.current;
		const W = canvas.width;
		const H = canvas.height;

		drawStory( ctx, W, H, s );

		// Pending edge overlay.
		if ( s.isEdgeMode && s.edgeStartNodeId !== null && mousePos.current ) {
			const fromNode = s.nodes.find( ( n ) => n.id === s.edgeStartNodeId );
			if ( fromNode ) {
				drawPendingEdge( ctx, W, H, fromNode, mousePos.current.x, mousePos.current.y, s.lineColor );
			}
		}

		animFrame.current = requestAnimationFrame( render );
	}, [] );

	useEffect( () => {
		animFrame.current = requestAnimationFrame( render );
		return () => cancelAnimationFrame( animFrame.current );
	}, [ render ] );

	// ── Pointer helpers ───────────────────────────────────────────────────────

	function getCanvasCoords( e: React.MouseEvent< HTMLCanvasElement > ): { x: number; y: number } {
		const rect = canvasRef.current!.getBoundingClientRect();
		const scaleX = canvasRef.current!.width  / rect.width;
		const scaleY = canvasRef.current!.height / rect.height;
		return {
			x: ( e.clientX - rect.left ) * scaleX,
			y: ( e.clientY - rect.top  ) * scaleY,
		};
	}

	function setCursor( cursor: string ) {
		if ( canvasRef.current ) canvasRef.current.style.cursor = cursor;
	}

	// ── Mouse handlers ────────────────────────────────────────────────────────

	function handleMouseDown( e: React.MouseEvent< HTMLCanvasElement > ) {
		if ( e.button !== 0 ) return;
		const { x, y } = getCanvasCoords( e );
		const canvas   = canvasRef.current!;
		const s        = stateRef.current;

		const nodeId = getNodeAtPoint( x, y, s.nodes, canvas.width, canvas.height );
		if ( nodeId !== null ) {
			dragging.current = { nodeId, startX: x, startY: y };
			setCursor( 'grabbing' );
		}
	}

	function handleMouseMove( e: React.MouseEvent< HTMLCanvasElement > ) {
		const { x, y } = getCanvasCoords( e );
		mousePos.current = { x, y };

		if ( dragging.current ) return; // cursor already 'grabbing'

		const canvas = canvasRef.current!;
		const s      = stateRef.current;

		if ( s.isEdgeMode ) {
			setCursor( 'crosshair' );
			return;
		}
		const nodeId = getNodeAtPoint( x, y, s.nodes, canvas.width, canvas.height );
		setCursor( nodeId !== null ? 'grab' : 'default' );
	}

	function handleMouseUp( e: React.MouseEvent< HTMLCanvasElement > ) {
		if ( e.button !== 0 ) return;
		const { x, y } = getCanvasCoords( e );
		const canvas   = canvasRef.current!;
		const s        = stateRef.current;

		if ( dragging.current ) {
			const { nodeId, startX, startY } = dragging.current;
			dragging.current = null;

			const dx = x - startX;
			const dy = y - startY;
			if ( Math.sqrt( dx * dx + dy * dy ) > 4 ) {
				const nx = Math.max( 0, Math.min( 1, x / canvas.width  ) );
				const ny = Math.max( 0, Math.min( 1, y / canvas.height ) );
				onNodeDragEnd( nodeId, nx, ny );
			} else {
				// Short movement = click: select the node.
				onNodeClick( nodeId );
			}

			// Restore hover cursor.
			const hoverNodeId = getNodeAtPoint( x, y, s.nodes, canvas.width, canvas.height );
			setCursor( s.isEdgeMode ? 'crosshair' : hoverNodeId !== null ? 'grab' : 'default' );
			return;
		}

		const nodeId = getNodeAtPoint( x, y, s.nodes, canvas.width, canvas.height );
		if ( nodeId !== null ) {
			onNodeClick( nodeId );
			return;
		}

		const edgeId = getEdgeAtPoint( x, y, s.edges, s.nodes, canvas.width, canvas.height );
		if ( edgeId !== null ) {
			onEdgeClick( edgeId );
			return;
		}

		// Empty canvas click — add node or cancel edge mode.
		const nx = Math.max( 0, Math.min( 1, x / canvas.width  ) );
		const ny = Math.max( 0, Math.min( 1, y / canvas.height ) );
		onCanvasClick( nx, ny );
	}

	function handleMouseLeave() {
		mousePos.current = null;
		if ( ! dragging.current ) {
			setCursor( stateRef.current.isEdgeMode ? 'crosshair' : 'default' );
		}
	}

	return (
		<canvas
			ref={ canvasRef }
			width={ canvasW }
			height={ canvasH }
			style={ { maxWidth: '100%', height: 'auto', display: 'block' } }
			onMouseDown={ handleMouseDown }
			onMouseMove={ handleMouseMove }
			onMouseUp={ handleMouseUp }
			onMouseLeave={ handleMouseLeave }
		/>
	);
}
