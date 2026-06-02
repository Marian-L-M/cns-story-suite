/**
 * Frontend view script for the cns-story-suite/story block.
 */

// ── Image loading ─────────────────────────────────────────────────────────────

const imgCache = new Map();

function loadImg( url ) {
	if ( imgCache.has( url ) ) return imgCache.get( url );
	const img = new Image();
	img.src = url;
	imgCache.set( url, img );
	return img;
}

// ── Path numbering (mirrors CanvasNodeList algorithm) ─────────────────────────

/**
 * Returns an ordered list of { node, depth, stepNumber } for display.
 * stepNumber is number[]|null — e.g. [1,2,1] → "1.2.1", null = root.
 *
 * Numbering:
 *   • Each component root (startNodeId first, then other in-degree-0 nodes) is unnumbered.
 *   • Top-level section numbers are allocated globally across all components.
 *   • A root with N branches uses sections [nextSection … nextSection+N-1]; a leafless root uses 1 section.
 *   • Children of a root → [section, 1]; linear → increment last; branch → append child index.
 */
function buildOrderedNodes( nodes, edges, startNodeId ) {
	const stepNums     = new Map();
	const fromBranchOf = new Map();

	const startId = startNodeId ?? nodes[ 0 ]?.id ?? null;

	function computeReachable( fromId ) {
		const r = new Set();
		function dfs( id ) {
			if ( r.has( id ) ) return;
			r.add( id );
			for ( const e of edges ) { if ( e.fromNodeId === id ) dfs( e.toNodeId ); }
		}
		dfs( fromId );
		return r;
	}

	const inDegree = new Map();
	for ( const n of nodes ) inDegree.set( n.id, 0 );
	for ( const e of edges ) inDegree.set( e.toNodeId, ( inDegree.get( e.toNodeId ) ?? 0 ) + 1 );

	const roots = [];
	if ( startId !== null ) roots.push( startId );
	for ( const n of nodes ) {
		if ( n.id !== startId && inDegree.get( n.id ) === 0 ) roots.push( n.id );
	}

	const result  = [];
	const visited = new Set();
	let nextSection = 1;

	for ( const rootId of roots ) {
		const reachable = computeReachable( rootId );

		function assignChildren( nodeId, parentNum, fromBranch, isRoot ) {
			const out = edges
				.filter( ( e ) => e.fromNodeId === nodeId && reachable.has( e.toNodeId ) )
				.sort( ( a, b ) => a.sortOrder - b.sortOrder );

			if ( isRoot ) {
				const used = Math.max( 1, out.length );
				out.forEach( ( e, i ) => {
					if ( ! stepNums.has( e.toNodeId ) ) {
						stepNums.set( e.toNodeId, [ nextSection + i, 1 ] );
						fromBranchOf.set( e.toNodeId, false );
					}
				} );
				nextSection += used;
			} else if ( parentNum ) {
				if ( out.length === 1 ) {
					const cid = out[ 0 ].toNodeId;
					if ( ! stepNums.has( cid ) ) {
						const cn = fromBranch
							? [ ...parentNum, 1 ]
							: [ ...parentNum.slice( 0, -1 ), parentNum[ parentNum.length - 1 ] + 1 ];
						stepNums.set( cid, cn );
						fromBranchOf.set( cid, false );
					}
				} else if ( out.length > 1 ) {
					out.forEach( ( e, i ) => {
						if ( ! stepNums.has( e.toNodeId ) ) {
							stepNums.set( e.toNodeId, [ ...parentNum, i + 1 ] );
							fromBranchOf.set( e.toNodeId, true );
						}
					} );
				}
			}
		}

		function visit( nodeId, depth, isRoot ) {
			if ( visited.has( nodeId ) ) return;
			visited.add( nodeId );

			const node = nodes.find( ( n ) => n.id === nodeId );
			if ( ! node ) return;

			const stepNumber = isRoot ? null : ( stepNums.get( nodeId ) ?? null );
			if ( ! isRoot ) result.push( { node, depth, stepNumber } );

			const outEdges = edges
				.filter( ( e ) => e.fromNodeId === nodeId && reachable.has( e.toNodeId ) )
				.sort( ( a, b ) => a.sortOrder - b.sortOrder );

			assignChildren( nodeId, stepNumber, fromBranchOf.get( nodeId ) ?? false, isRoot );

			for ( const e of outEdges ) visit( e.toNodeId, depth + 1, false );
		}

		visit( rootId, 0, true );
	}

	for ( const n of nodes ) { if ( ! visited.has( n.id ) ) { result.push( { node: n, depth: 0, stepNumber: null } ); visited.add( n.id ); } }

	return result;
}

// ── Canvas drawing ────────────────────────────────────────────────────────────

function drawStory( canvas, data, activeNodeId ) {
	const ctx = canvas.getContext( '2d' );
	if ( ! ctx ) return;

	const W = canvas.width;
	const H = canvas.height;

	ctx.clearRect( 0, 0, W, H );

	const m = data.mapData;

	if ( m?.bgType === 'image' && m.bgImageUrl ) {
		const bg = loadImg( m.bgImageUrl );
		if ( bg.complete && bg.naturalWidth ) ctx.drawImage( bg, 0, 0, W, H );
		else { ctx.fillStyle = m?.bgColor ?? '#1a1a2e'; ctx.fillRect( 0, 0, W, H ); }
	} else {
		ctx.fillStyle = m?.bgColor ?? '#1a1a2e';
		ctx.fillRect( 0, 0, W, H );
	}

	if ( m?.imageUrl ) {
		const img = loadImg( m.imageUrl );
		if ( img.complete && img.naturalWidth ) {
			const iw = m.imageW * W;
			ctx.drawImage( img, m.imageX * W, m.imageY * H, iw, ( iw / img.naturalWidth ) * img.naturalHeight );
		}
	}

	if ( m?.areas ) {
		ctx.save();
		for ( const area of m.areas ) {
			const pts = area.nodes;
			if ( pts.length < 2 ) continue;
			const s = area.canvasStyles;
			ctx.beginPath();
			ctx.moveTo( pts[ 0 ].x * W, pts[ 0 ].y * H );
			for ( let i = 1; i < pts.length; i++ ) ctx.lineTo( pts[ i ].x * W, pts[ i ].y * H );
			ctx.closePath();
			ctx.globalAlpha = 0.15 * ( s?.fillOpacity ?? 1 );
			ctx.fillStyle   = s?.fill ?? '#888888';
			ctx.fill();
			ctx.globalAlpha = 0.25;
			ctx.strokeStyle = s?.stroke ?? '#aaa';
			ctx.lineWidth   = s?.strokeWidth ?? 1;
			ctx.setLineDash( [] );
			ctx.stroke();
		}
		ctx.restore();
	}

	if ( m?.objects ) {
		const mapW = m.width;
		const mapH = mapW * m.aspectRatio;
		ctx.save();
		ctx.globalAlpha = 0.4;
		for ( const obj of m.objects ) {
			const cx   = ( obj.x / mapW ) * W;
			const cy   = ( obj.y / mapH ) * H;
			const size = ( obj.canvasStyles?.size ?? 32 ) * ( W / mapW );
			if ( obj.iconUrl ) {
				const img = loadImg( obj.iconUrl );
				if ( img.complete && img.naturalWidth ) { ctx.drawImage( img, cx - size / 2, cy - size / 2, size, size ); continue; }
			}
			ctx.beginPath();
			ctx.arc( cx, cy, size / 2, 0, Math.PI * 2 );
			ctx.fillStyle = obj.canvasStyles?.fillStyle ?? '#888';
			ctx.fill();
		}
		ctx.restore();
	}

	const story   = data.story;
	const nodeMap = new Map( data.nodes.map( ( n ) => [ n.id, n ] ) );

	for ( const edge of data.edges ) {
		const color   = edge.lineColor   ?? story.lineColor;
		const width   = edge.lineWidth   ?? story.lineWidth;
		const lstyle  = edge.lineStyle   ?? story.lineStyle;
		const opacity = edge.lineOpacity ?? story.lineOpacity;

		const from = nodeMap.get( edge.fromNodeId );
		const to   = nodeMap.get( edge.toNodeId );
		if ( ! from || ! to ) continue;
		const fx = from.x * W, fy = from.y * H, tx = to.x * W, ty = to.y * H;

		ctx.save();
		ctx.strokeStyle = color;
		ctx.lineWidth   = width;
		ctx.globalAlpha = opacity;
		if      ( lstyle === 'dashed' ) ctx.setLineDash( [ 10, 5 ] );
		else if ( lstyle === 'dotted' ) ctx.setLineDash( [ 2, 5 ] );
		else                            ctx.setLineDash( [] );
		ctx.beginPath(); ctx.moveTo( fx, fy ); ctx.lineTo( tx, ty ); ctx.stroke();
		ctx.restore();

		const angle = Math.atan2( ty - fy, tx - fx );
		const sz    = Math.max( 10, width * 3 );
		const nr    = 16;
		const ex    = tx - Math.cos( angle ) * nr;
		const ey    = ty - Math.sin( angle ) * nr;
		ctx.save();
		ctx.setLineDash( [] );
		ctx.globalAlpha = opacity;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.moveTo( ex, ey );
		ctx.lineTo( ex - sz * Math.cos( angle - Math.PI / 6 ), ey - sz * Math.sin( angle - Math.PI / 6 ) );
		ctx.lineTo( ex - sz * Math.cos( angle + Math.PI / 6 ), ey - sz * Math.sin( angle + Math.PI / 6 ) );
		ctx.closePath(); ctx.fill(); ctx.restore();
	}

	const BASE_R = 14;
	for ( const node of data.nodes ) {
		const cx          = node.x * W;
		const cy          = node.y * H;
		const r           = BASE_R * node.iconSize;
		const isActive    = node.id === activeNodeId;
		const borderColor = node.iconBorderColor || '#000000';
		const borderWidth = node.iconBorderWidth ?? 2;

		if ( isActive ) {
			ctx.save(); ctx.beginPath(); ctx.arc( cx, cy, r + 5, 0, Math.PI * 2 );
			ctx.strokeStyle = '#00aaff'; ctx.lineWidth = 3; ctx.setLineDash( [] ); ctx.globalAlpha = 1; ctx.stroke(); ctx.restore();
		}

		// ── Thumbnail ──────────────────────────────────────────────────────
		if ( node.iconType === 'thumbnail' && node.substoryThumbnailUrl ) {
			const img = loadImg( node.substoryThumbnailUrl );
			if ( img.complete && img.naturalWidth ) {
				const useSquare = node.iconBgShape === 'square';
				ctx.save();
				if ( useSquare ) {
					if ( node.iconBgColor ) { ctx.fillStyle = node.iconBgColor; ctx.fillRect( cx - r, cy - r, r * 2, r * 2 ); }
					ctx.beginPath(); ctx.rect( cx - r, cy - r, r * 2, r * 2 ); ctx.clip();
					ctx.drawImage( img, cx - r, cy - r, r * 2, r * 2 );
				} else {
					if ( node.iconBgColor ) {
						ctx.beginPath(); ctx.arc( cx, cy, r, 0, Math.PI * 2 );
						ctx.fillStyle = node.iconBgColor; ctx.fill();
					}
					ctx.beginPath(); ctx.arc( cx, cy, r, 0, Math.PI * 2 ); ctx.clip();
					ctx.drawImage( img, cx - r, cy - r, r * 2, r * 2 );
				}
				ctx.restore();
				if ( borderWidth > 0 ) {
					ctx.save();
					ctx.beginPath();
					if ( useSquare ) ctx.rect( cx - r, cy - r, r * 2, r * 2 );
					else             ctx.arc( cx, cy, r, 0, Math.PI * 2 );
					ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth; ctx.setLineDash( [] ); ctx.stroke();
					ctx.restore();
				}
				continue;
			}
		}

		// ── Icon ───────────────────────────────────────────────────────────
		if ( node.iconType === 'icon' && node.iconUrl ) {
			const img = loadImg( node.iconUrl );
			if ( img.complete && img.naturalWidth ) {
				if ( node.iconBgShape !== 'none' ) {
					ctx.save();
					if ( node.iconBgShape === 'square' ) {
						ctx.fillStyle = node.iconBgColor || '#ffffff';
						ctx.fillRect( cx - r, cy - r, r * 2, r * 2 );
						if ( borderWidth > 0 ) {
							ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth; ctx.setLineDash( [] );
							ctx.strokeRect( cx - r, cy - r, r * 2, r * 2 );
						}
					} else {
						ctx.beginPath(); ctx.arc( cx, cy, r, 0, Math.PI * 2 );
						ctx.fillStyle = node.iconBgColor || '#ffffff'; ctx.fill();
						if ( borderWidth > 0 ) {
							ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth; ctx.setLineDash( [] ); ctx.stroke();
						}
					}
					ctx.restore();
				}
				ctx.drawImage( img, cx - r, cy - r, r * 2, r * 2 );
				continue;
			}
		}

		// ── Diamond ────────────────────────────────────────────────────────
		if ( node.iconType === 'diamond' ) {
			ctx.save();
			ctx.beginPath();
			ctx.moveTo( cx, cy - r ); ctx.lineTo( cx + r, cy );
			ctx.lineTo( cx, cy + r ); ctx.lineTo( cx - r, cy );
			ctx.closePath();
			ctx.fillStyle = node.iconColor; ctx.fill();
			if ( borderWidth > 0 ) {
				ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth; ctx.setLineDash( [] ); ctx.stroke();
			}
			ctx.restore();
			continue;
		}

		// ── Square ─────────────────────────────────────────────────────────
		if ( node.iconType === 'square' ) {
			ctx.save();
			ctx.fillStyle = node.iconColor;
			ctx.fillRect( cx - r, cy - r, r * 2, r * 2 );
			if ( borderWidth > 0 ) {
				ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth; ctx.setLineDash( [] );
				ctx.strokeRect( cx - r, cy - r, r * 2, r * 2 );
			}
			ctx.restore();
			continue;
		}

		// ── Round (default) ────────────────────────────────────────────────
		ctx.save();
		ctx.beginPath(); ctx.arc( cx, cy, r, 0, Math.PI * 2 );
		ctx.fillStyle = node.iconColor; ctx.fill();
		if ( borderWidth > 0 ) {
			ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth; ctx.setLineDash( [] ); ctx.stroke();
		}
		ctx.restore();
	}
}

// ── Story window (accordion list) ─────────────────────────────────────────────

function renderWindow( windowEl, data, activeNodeId, expandedIds ) {
	// Auto-expand the active node.
	if ( activeNodeId !== null ) expandedIds.add( activeNodeId );

	const items = buildOrderedNodes( data.nodes, data.edges, data.story.startNodeId );

	const rows = items.map( ( { node, depth, stepNumber } ) => {
		const title    = node.titleOverride || node.substoryTitle || '';
		const excerpt  = node.excerptOverride || node.substoryExcerpt || '';
		const numStr   = stepNumber ? stepNumber.join( '.' ) : '—';
		const isActive = node.id === activeNodeId;
		const isOpen   = expandedIds.has( node.id );
		const indent   = 8 + Math.min( depth, 4 ) * 14;
		const dotR        = node.iconType === 'square' ? '2px' : '0';
		const dotTransform = node.iconType === 'diamond' ? 'rotate(45deg)' : '';
		const dotBorderR   = node.iconType === 'round' || node.iconType === 'thumbnail' || node.iconType === 'icon' ? '50%' : dotR;
		const hasDetail = excerpt || node.substoryUrl;

		return `<div class="cns-sw-item${ isActive ? ' is-active' : '' }${ isOpen ? ' is-open' : '' }" data-node="${ node.id }" style="padding-left:${ indent }px">
			<button class="cns-sw-item__head" type="button">
				<span class="cns-sw-item__num">${ esc( numStr ) }</span>
				<span class="cns-sw-item__dot" style="background:${ esc( node.iconColor ) };border-radius:${ dotBorderR };transform:${ dotTransform }"></span>
				<span class="cns-sw-item__title">${ esc( title ) }</span>
			</button>
			${ hasDetail ? `<div class="cns-sw-item__detail">
				${ excerpt ? `<p class="cns-sw-item__excerpt">${ esc( excerpt ) }</p>` : '' }
				${ node.substoryUrl ? `<a href="${ esc( node.substoryUrl ) }" class="cns-sw-item__read-more">Read more →</a>` : '' }
			</div>` : '' }
		</div>`;
	} );

	windowEl.innerHTML = `<div class="cns-sw-list">${ rows.join( '' ) }</div>`;

	// Scroll active item into view.
	const activeEl = windowEl.querySelector( '.cns-sw-item.is-active' );
	if ( activeEl ) activeEl.scrollIntoView( { block: 'nearest', behavior: 'smooth' } );

	// Toggle expand + navigate.
	windowEl.querySelectorAll( '.cns-sw-item__head' ).forEach( ( btn ) => {
		btn.addEventListener( 'click', () => {
			const item   = btn.closest( '.cns-sw-item' );
			const nodeId = parseInt( item.dataset.node, 10 );

			if ( expandedIds.has( nodeId ) ) {
				expandedIds.delete( nodeId );
			} else {
				expandedIds.add( nodeId );
			}

			item.dispatchEvent( new CustomEvent( 'cns-navigate', { bubbles: true, detail: { nodeId } } ) );
		} );
	} );
}

function esc( str ) {
	return String( str )
		.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' ).replace( /"/g, '&quot;' );
}

// ── Block init ────────────────────────────────────────────────────────────────

function initBlock( blockEl ) {
	const rawData = blockEl.dataset.storyData;
	if ( ! rawData ) return;

	let data;
	try { data = JSON.parse( rawData ); } catch { return; }

	const canvas   = blockEl.querySelector( '.cns-story-canvas' );
	const windowEl = blockEl.querySelector( '.cns-story-window' );
	if ( ! canvas || ! windowEl ) return;

	const m    = data.mapData;
	const canW = m?.width ?? 900;
	const canH = m ? Math.round( m.width * m.aspectRatio ) : 600;

	canvas.width  = canW;
	canvas.height = canH;
	canvas.style.cssText = 'max-width:100%;height:auto;display:block;';

	let activeNodeId = data.story.startNodeId ?? ( data.nodes[ 0 ]?.id ?? null );
	const expandedIds = new Set();

	function redraw()   { drawStory( canvas, data, activeNodeId ); }
	function rerender() { renderWindow( windowEl, data, activeNodeId, expandedIds ); redraw(); }

	// Preload images then start loop.
	const urls = [];
	if ( m?.bgImageUrl ) urls.push( m.bgImageUrl );
	if ( m?.imageUrl   ) urls.push( m.imageUrl   );
	( m?.objects ?? [] ).forEach( ( o ) => { if ( o.iconUrl ) urls.push( o.iconUrl ); } );
	data.nodes.forEach( ( n ) => {
		if ( n.iconUrl ) urls.push( n.iconUrl );
		if ( n.substoryThumbnailUrl ) urls.push( n.substoryThumbnailUrl );
	} );

	requestAnimationFrame( function loop() { redraw(); requestAnimationFrame( loop ); } );

	urls.forEach( ( url ) => { loadImg( url ); } );

	// Canvas click — select node.
	canvas.addEventListener( 'click', ( e ) => {
		const rect   = canvas.getBoundingClientRect();
		const scaleX = canvas.width  / rect.width;
		const scaleY = canvas.height / rect.height;
		const mx = ( e.clientX - rect.left ) * scaleX;
		const my = ( e.clientY - rect.top  ) * scaleY;
		const BASE_R = 14;
		for ( let i = data.nodes.length - 1; i >= 0; i-- ) {
			const n = data.nodes[ i ];
			const r = ( BASE_R * n.iconSize ) + 5;
			if ( ( mx - n.x * canvas.width ) ** 2 + ( my - n.y * canvas.height ) ** 2 <= r ** 2 ) {
				activeNodeId = n.id;
				rerender();
				return;
			}
		}
	} );

	// List navigation.
	blockEl.addEventListener( 'cns-navigate', ( e ) => {
		activeNodeId = e.detail.nodeId;
		rerender();
	} );

	rerender();
}

document.querySelectorAll( '.cns-story-block' ).forEach( initBlock );
