import type { StoryNode, StoryEdge, StoryPath, MapRenderData, MapObjectRef, MapAreaRef, LineStyle, MarkerType } from '../../types';

// ── Image cache ───────────────────────────────────────────────────────────────

const imageCache = new Map< string, HTMLImageElement >();

export function loadImage( url: string ): HTMLImageElement {
	if ( imageCache.has( url ) ) return imageCache.get( url )!;
	const img = new Image();
	img.src = url;
	imageCache.set( url, img );
	return img;
}

export function preloadImages( urls: string[] ): void {
	urls.forEach( loadImage );
}

// ── Draw state ────────────────────────────────────────────────────────────────

export interface DrawState {
	mapData:            MapRenderData | null;
	mapObjects:         MapObjectRef[];
	mapAreas:           MapAreaRef[];
	nodes:              StoryNode[];
	edges:              StoryEdge[];
	paths:              StoryPath[];
	selectedNodeId:     number | null;
	edgeStartNodeId:    number | null;
	lineColor:          string;
	lineWidth:          number;
	lineStyle:          LineStyle;
	lineOpacity:        number;
	markerColor:        string;
	markerSize:         number;
	markerType:         MarkerType;
	markerIconUrl:      string;
	markerIconOffsetX:  number;
	markerIconOffsetY:  number;
}

// ── Main draw entry ───────────────────────────────────────────────────────────

export function drawStory(
	ctx: CanvasRenderingContext2D,
	W: number,
	H: number,
	state: DrawState
): void {
	ctx.clearRect( 0, 0, W, H );
	drawBackground( ctx, W, H, state );
	drawMapImage( ctx, W, H, state );
	drawMapAreas( ctx, W, H, state );
	drawMapObjects( ctx, W, H, state );
	drawEdges( ctx, W, H, state );
	drawNodes( ctx, W, H, state );
}

// ── Layer: background ─────────────────────────────────────────────────────────

function drawBackground( ctx: CanvasRenderingContext2D, W: number, H: number, state: DrawState ): void {
	const bg = state.mapData;
	if ( bg?.bgType === 'image' && bg.bgImageUrl ) {
		const img = loadImage( bg.bgImageUrl );
		if ( img.complete && img.naturalWidth ) {
			ctx.drawImage( img, 0, 0, W, H );
			return;
		}
		img.onload = () => {};
	}
	ctx.fillStyle = bg?.bgColor ?? '#1a1a2e';
	ctx.fillRect( 0, 0, W, H );
}

// ── Layer: map main image ─────────────────────────────────────────────────────

function drawMapImage( ctx: CanvasRenderingContext2D, W: number, H: number, state: DrawState ): void {
	const m = state.mapData;
	if ( ! m?.imageUrl ) return;
	const img = loadImage( m.imageUrl );
	if ( ! img.complete || ! img.naturalWidth ) return;

	const iw = m.imageW * W;
	const ih = ( iw / img.naturalWidth ) * img.naturalHeight;
	ctx.drawImage( img, m.imageX * W, m.imageY * H, iw, ih );
}

// ── Layer: map areas (read-only, dimmed) ──────────────────────────────────────

function drawMapAreas( ctx: CanvasRenderingContext2D, W: number, H: number, state: DrawState ): void {
	if ( ! state.mapData ) return;
	ctx.save();

	for ( const area of state.mapAreas ) {
		const pts = area.nodes;
		if ( pts.length < 2 ) continue;
		const s = area.canvasStyles;

		ctx.beginPath();
		ctx.moveTo( pts[ 0 ].x * W, pts[ 0 ].y * H );
		for ( let i = 1; i < pts.length; i++ ) {
			ctx.lineTo( pts[ i ].x * W, pts[ i ].y * H );
		}
		ctx.closePath();

		ctx.globalAlpha = 0.15 * ( s?.fillOpacity ?? 1 );
		ctx.fillStyle   = s?.fill ?? '#888888';
		ctx.fill();

		ctx.globalAlpha = 0.25;
		ctx.strokeStyle = s?.stroke ?? '#aaaaaa';
		ctx.lineWidth   = s?.strokeWidth ?? 1;
		ctx.setLineDash( [] );
		ctx.stroke();
	}

	ctx.restore();
}

// ── Layer: map objects (read-only, dimmed) ────────────────────────────────────

function drawMapObjects( ctx: CanvasRenderingContext2D, W: number, H: number, state: DrawState ): void {
	if ( ! state.mapData ) return;
	const { width: mapW, aspectRatio } = state.mapData;
	const mapH = mapW * aspectRatio;

	ctx.save();
	ctx.globalAlpha = 0.4;

	for ( const obj of state.mapObjects ) {
		const cx   = ( obj.x / mapW ) * W;
		const cy   = ( obj.y / mapH ) * H;
		const size = ( obj.canvasStyles?.size ?? 32 ) * ( W / mapW );

		if ( obj.iconUrl ) {
			const img = loadImage( obj.iconUrl );
			if ( img.complete && img.naturalWidth ) {
				ctx.drawImage( img, cx - size / 2, cy - size / 2, size, size );
				continue;
			}
		}
		ctx.beginPath();
		ctx.arc( cx, cy, size / 2, 0, Math.PI * 2 );
		ctx.fillStyle = obj.canvasStyles?.fillStyle ?? '#888888';
		ctx.fill();
	}

	ctx.restore();
}

// ── Layer: story edges ────────────────────────────────────────────────────────

function drawEdges( ctx: CanvasRenderingContext2D, W: number, H: number, state: DrawState ): void {
	if ( ! state.nodes.length || ! state.edges.length ) return;
	const nodeMap = new Map( state.nodes.map( n => [ n.id, n ] ) );

	for ( const edge of state.edges ) {
		const color   = edge.lineColor   ?? state.lineColor;
		const width   = edge.lineWidth   ?? state.lineWidth;
		const lstyle  = edge.lineStyle   ?? state.lineStyle;
		const opacity = edge.lineOpacity ?? state.lineOpacity;

		const from = nodeMap.get( edge.fromNodeId );
		const to   = nodeMap.get( edge.toNodeId );
		if ( ! from || ! to ) continue;

		const fx = from.x * W, fy = from.y * H;
		const tx = to.x   * W, ty = to.y   * H;

		ctx.save();
		ctx.strokeStyle = color;
		ctx.lineWidth   = width;
		ctx.globalAlpha = opacity;
		if      ( lstyle === 'dashed' ) ctx.setLineDash( [ 10, 5 ] );
		else if ( lstyle === 'dotted' ) ctx.setLineDash( [ 2,  5 ] );
		else                            ctx.setLineDash( [] );
		ctx.beginPath();
		ctx.moveTo( fx, fy );
		ctx.lineTo( tx, ty );
		ctx.stroke();
		ctx.restore();

		drawArrowhead( ctx, fx, fy, tx, ty, width, color, opacity );
	}
}

function drawArrowhead(
	ctx: CanvasRenderingContext2D,
	fx: number, fy: number,
	tx: number, ty: number,
	lineWidth: number,
	color: string,
	alpha: number
): void {
	const angle      = Math.atan2( ty - fy, tx - fx );
	const arrowSize  = Math.max( 10, lineWidth * 3 );
	const nodeRadius = 16;

	const endX = tx - Math.cos( angle ) * nodeRadius;
	const endY = ty - Math.sin( angle ) * nodeRadius;

	ctx.save();
	ctx.setLineDash( [] );
	ctx.globalAlpha = alpha;
	ctx.fillStyle   = color;
	ctx.beginPath();
	ctx.moveTo( endX, endY );
	ctx.lineTo(
		endX - arrowSize * Math.cos( angle - Math.PI / 6 ),
		endY - arrowSize * Math.sin( angle - Math.PI / 6 )
	);
	ctx.lineTo(
		endX - arrowSize * Math.cos( angle + Math.PI / 6 ),
		endY - arrowSize * Math.sin( angle + Math.PI / 6 )
	);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

// ── Layer: story nodes ────────────────────────────────────────────────────────

const NODE_BASE_RADIUS = 14;

function drawNodes( ctx: CanvasRenderingContext2D, W: number, H: number, state: DrawState ): void {
	for ( const node of state.nodes ) {
		const cx         = node.x * W;
		const cy         = node.y * H;
		const isSelected = node.id === state.selectedNodeId;
		const isEdgeSrc  = node.id === state.edgeStartNodeId;
		drawNode( ctx, cx, cy, node, isSelected, isEdgeSrc, state );
	}
}

function drawNode(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	node: StoryNode,
	isSelected: boolean,
	isEdgeSrc: boolean,
	state: DrawState
): void {
	const r           = NODE_BASE_RADIUS * node.iconSize;
	const borderColor = node.iconBorderColor || '#000000';
	const borderWidth = node.iconBorderWidth ?? 2;

	// Resolve marker settings: node > path > global
	const path        = node.pathId ? state.paths.find( ( p ) => p.id === node.pathId ) ?? null : null;
	const markerColor = node.markerColor     ?? path?.markerColor     ?? state.markerColor;
	const markerSize  = node.markerSize      ?? path?.markerSize      ?? state.markerSize;
	const mOffX       = node.markerIconOffsetX ?? path?.markerIconOffsetX ?? state.markerIconOffsetX;
	const mOffY       = node.markerIconOffsetY ?? path?.markerIconOffsetY ?? state.markerIconOffsetY;
	const mType = node.markerType !== 'inherit'
		? node.markerType
		: ( path?.markerType ?? state.markerType );
	const mIconUrl = node.markerType === 'icon'
		? ( node.markerIconUrl || path?.markerIconUrl || state.markerIconUrl )
		: node.markerType === 'inherit'
			? ( path?.markerType === 'icon' ? ( path.markerIconUrl || state.markerIconUrl )
				: ( state.markerType === 'icon' ? state.markerIconUrl : '' ) )
			: '';

	// Selection / edge-source marker
	if ( isSelected || isEdgeSrc ) {
		if ( ! isEdgeSrc && mType === 'icon' && mIconUrl ) {
			const img = loadImage( mIconUrl );
			if ( img.complete && img.naturalWidth ) {
				const mR = r * 0.8;
				ctx.save();
				ctx.globalAlpha = 1;
				ctx.drawImage( img, cx + mOffX - mR, cy + mOffY - mR, mR * 2, mR * 2 );
				ctx.restore();
			}
		} else {
			ctx.save();
			ctx.beginPath();
			ctx.arc( cx, cy, r + markerSize, 0, Math.PI * 2 );
			ctx.strokeStyle = isEdgeSrc ? '#ffcc00' : markerColor;
			ctx.lineWidth   = 3;
			ctx.setLineDash( [] );
			ctx.globalAlpha = 1;
			ctx.stroke();
			ctx.restore();
		}
	}

	// ── Thumbnail ────────────────────────────────────────────────────────────
	if ( node.iconType === 'thumbnail' && node.substoryThumbnailUrl ) {
		const img = loadImage( node.substoryThumbnailUrl );
		if ( img.complete && img.naturalWidth ) {
			const useSquare = node.iconBgShape === 'square';
			ctx.save();
			if ( useSquare ) {
				if ( node.iconBgColor ) {
					ctx.fillStyle = node.iconBgColor;
					ctx.fillRect( cx - r, cy - r, r * 2, r * 2 );
				}
				ctx.beginPath();
				ctx.rect( cx - r, cy - r, r * 2, r * 2 );
				ctx.clip();
				ctx.drawImage( img, cx - r, cy - r, r * 2, r * 2 );
			} else {
				// round (default)
				if ( node.iconBgColor ) {
					ctx.beginPath();
					ctx.arc( cx, cy, r, 0, Math.PI * 2 );
					ctx.fillStyle = node.iconBgColor;
					ctx.fill();
				}
				ctx.beginPath();
				ctx.arc( cx, cy, r, 0, Math.PI * 2 );
				ctx.clip();
				ctx.drawImage( img, cx - r, cy - r, r * 2, r * 2 );
			}
			ctx.restore();
			if ( borderWidth > 0 ) {
				ctx.save();
				ctx.beginPath();
				if ( useSquare ) ctx.rect( cx - r, cy - r, r * 2, r * 2 );
				else             ctx.arc( cx, cy, r, 0, Math.PI * 2 );
				ctx.strokeStyle = borderColor;
				ctx.lineWidth   = borderWidth;
				ctx.setLineDash( [] );
				ctx.stroke();
				ctx.restore();
			}
			return;
		}
	}

	// ── Icon (image from library) ────────────────────────────────────────────
	if ( node.iconType === 'icon' && node.iconUrl ) {
		const img = loadImage( node.iconUrl );
		if ( img.complete && img.naturalWidth ) {
			if ( node.iconBgShape !== 'none' ) {
				ctx.save();
				if ( node.iconBgShape === 'square' ) {
					ctx.fillStyle = node.iconBgColor || '#ffffff';
					ctx.fillRect( cx - r, cy - r, r * 2, r * 2 );
					if ( borderWidth > 0 ) {
						ctx.strokeStyle = borderColor;
						ctx.lineWidth   = borderWidth;
						ctx.setLineDash( [] );
						ctx.strokeRect( cx - r, cy - r, r * 2, r * 2 );
					}
				} else {
					ctx.beginPath();
					ctx.arc( cx, cy, r, 0, Math.PI * 2 );
					ctx.fillStyle = node.iconBgColor || '#ffffff';
					ctx.fill();
					if ( borderWidth > 0 ) {
						ctx.strokeStyle = borderColor;
						ctx.lineWidth   = borderWidth;
						ctx.setLineDash( [] );
						ctx.stroke();
					}
				}
				ctx.restore();
			}
			ctx.drawImage( img, cx - r, cy - r, r * 2, r * 2 );
			return;
		}
	}

	// ── Diamond ──────────────────────────────────────────────────────────────
	if ( node.iconType === 'diamond' ) {
		ctx.save();
		ctx.beginPath();
		ctx.moveTo( cx,     cy - r );
		ctx.lineTo( cx + r, cy     );
		ctx.lineTo( cx,     cy + r );
		ctx.lineTo( cx - r, cy     );
		ctx.closePath();
		ctx.fillStyle = node.iconColor;
		ctx.fill();
		if ( borderWidth > 0 ) {
			ctx.strokeStyle = borderColor;
			ctx.lineWidth   = borderWidth;
			ctx.setLineDash( [] );
			ctx.stroke();
		}
		ctx.restore();
		return;
	}

	// ── Square ───────────────────────────────────────────────────────────────
	if ( node.iconType === 'square' ) {
		ctx.save();
		ctx.fillStyle = node.iconColor;
		ctx.fillRect( cx - r, cy - r, r * 2, r * 2 );
		if ( borderWidth > 0 ) {
			ctx.strokeStyle = borderColor;
			ctx.lineWidth   = borderWidth;
			ctx.setLineDash( [] );
			ctx.strokeRect( cx - r, cy - r, r * 2, r * 2 );
		}
		ctx.restore();
		return;
	}

	// ── Round (default / thumbnail fallback) ─────────────────────────────────
	ctx.save();
	ctx.beginPath();
	ctx.arc( cx, cy, r, 0, Math.PI * 2 );
	ctx.fillStyle = node.iconColor;
	ctx.fill();
	if ( borderWidth > 0 ) {
		ctx.strokeStyle = borderColor;
		ctx.lineWidth   = borderWidth;
		ctx.setLineDash( [] );
		ctx.stroke();
	}
	ctx.restore();
}

// ── Hit testing ───────────────────────────────────────────────────────────────

export function getNodeAtPoint(
	mouseX: number,
	mouseY: number,
	nodes: StoryNode[],
	W: number,
	H: number
): number | null {
	for ( let i = nodes.length - 1; i >= 0; i-- ) {
		const n  = nodes[ i ];
		const cx = n.x * W;
		const cy = n.y * H;
		const r  = ( NODE_BASE_RADIUS * n.iconSize ) + 5;
		if ( ( mouseX - cx ) ** 2 + ( mouseY - cy ) ** 2 <= r ** 2 ) {
			return n.id;
		}
	}
	return null;
}

export function getEdgeAtPoint(
	mouseX: number,
	mouseY: number,
	edges: StoryEdge[],
	nodes: StoryNode[],
	W: number,
	H: number,
	threshold = 8
): number | null {
	const nodeMap = new Map( nodes.map( ( n ) => [ n.id, n ] ) );

	for ( const edge of edges ) {
		const from = nodeMap.get( edge.fromNodeId );
		const to   = nodeMap.get( edge.toNodeId );
		if ( ! from || ! to ) continue;

		const fx = from.x * W;
		const fy = from.y * H;
		const tx = to.x * W;
		const ty = to.y * H;

		// Distance from point to line segment.
		const dx  = tx - fx;
		const dy  = ty - fy;
		const len = Math.sqrt( dx * dx + dy * dy );
		if ( len < 1 ) continue;

		const t = Math.max( 0, Math.min( 1, ( ( mouseX - fx ) * dx + ( mouseY - fy ) * dy ) / ( len * len ) ) );
		const px  = fx + t * dx;
		const py  = fy + t * dy;
		const dist = Math.sqrt( ( mouseX - px ) ** 2 + ( mouseY - py ) ** 2 );

		if ( dist <= threshold ) return edge.id;
	}
	return null;
}

// ── Edge-in-progress overlay ──────────────────────────────────────────────────

export function drawPendingEdge(
	ctx: CanvasRenderingContext2D,
	W: number,
	H: number,
	fromNode: StoryNode,
	mouseX: number,
	mouseY: number,
	color: string
): void {
	ctx.save();
	ctx.strokeStyle = color;
	ctx.lineWidth   = 2;
	ctx.setLineDash( [ 6, 4 ] );
	ctx.globalAlpha = 0.7;
	ctx.beginPath();
	ctx.moveTo( fromNode.x * W, fromNode.y * H );
	ctx.lineTo( mouseX, mouseY );
	ctx.stroke();
	ctx.restore();
}
