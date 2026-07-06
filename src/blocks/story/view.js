/**
 * Frontend view script for the cns-story-suite/story block.
 */

// ── Image loading ─────────────────────────────────────────────────────────────

const imgCache = new Map();

/**
 * Returns a (cached) Image for the URL. If the image hasn't finished loading
 * yet and a callback is given, it fires once on load so the caller can redraw.
 * Passing the same callback repeatedly is safe — addEventListener dedupes it.
 */
function loadImg( url, onLoad ) {
	let img = imgCache.get( url );
	if ( ! img ) {
		img = new Image();
		img.src = url;
		imgCache.set( url, img );
	}
	if ( onLoad && ! img.complete ) {
		img.addEventListener( 'load', onLoad, { once: true } );
	}
	return img;
}

// ── Infobox drawer (shared / reuses map drawer element if present) ────────────

function escHtml( str ) {
	return String( str )
		.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' ).replace( /"/g, '&quot;' );
}

function getOrCreateDrawer() {
	let drawer = document.getElementById( 'cns-map-drawer' );
	if ( ! drawer ) {
		drawer = document.createElement( 'div' );
		drawer.id        = 'cns-map-drawer';
		drawer.className = 'cns-map-drawer';
		drawer.setAttribute( 'role', 'dialog' );
		drawer.setAttribute( 'aria-modal', 'true' );
		drawer.innerHTML =
			'<div class="cns-map-drawer__backdrop"></div>' +
			'<div class="cns-map-drawer__panel">' +
				'<div class="cns-map-drawer__header">' +
					'<button class="cns-map-drawer__close" aria-label="Close">&times;</button>' +
				'</div>' +
				'<div class="cns-map-drawer__body"></div>' +
			'</div>';
		document.body.appendChild( drawer );
		drawer.querySelector( '.cns-map-drawer__backdrop' ).addEventListener( 'click', () => {
			drawer.classList.remove( 'is-open' );
			document.body.classList.remove( 'cns-map-drawer-open' );
		} );
		drawer.querySelector( '.cns-map-drawer__close' ).addEventListener( 'click', () => {
			drawer.classList.remove( 'is-open' );
			document.body.classList.remove( 'cns-map-drawer-open' );
		} );
		document.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Escape' && drawer.classList.contains( 'is-open' ) ) {
				drawer.classList.remove( 'is-open' );
				document.body.classList.remove( 'cns-map-drawer-open' );
			}
		} );
	}
	return drawer;
}

function showInfobox( item ) {
	const drawer   = getOrCreateDrawer();
	const body     = drawer.querySelector( '.cns-map-drawer__body' );
	const resolved = item.infoboxResolved || {};
	const title    = resolved.title    || item.title || '';
	const content  = resolved.content  || '';
	const imgUrl   = resolved.imageUrl || '';
	const postUrl  = resolved.postUrl  || '';
	let html = '';
	if ( imgUrl  ) html += '<img class="cns-map-drawer__image" src="' + encodeURI( imgUrl ) + '" alt="" />';
	if ( title   ) html += '<h2 class="cns-map-drawer__title">' + escHtml( title ) + '</h2>';
	if ( content ) html += '<div class="cns-map-drawer__content">' + content + '</div>';
	if ( postUrl ) html += '<a class="cns-map-drawer__link" href="' + encodeURI( postUrl ) + '">View full post &rarr;</a>';
	body.innerHTML = html;
	drawer.classList.add( 'is-open' );
	document.body.classList.add( 'cns-map-drawer-open' );
	drawer.querySelector( '.cns-map-drawer__close' ).focus();
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

// ── Area path builders (ported from cns-map-suite view.js so shapes match) ────

function buildPolygonPath( ctx, nodes, W, H ) {
	ctx.moveTo( nodes[ 0 ].x * W, nodes[ 0 ].y * H );
	for ( let i = 1; i < nodes.length; i++ ) {
		ctx.lineTo( nodes[ i ].x * W, nodes[ i ].y * H );
	}
	ctx.closePath();
}

function buildBezierPath( ctx, nodes, W, H ) {
	const n      = nodes.length;
	const startX = ( ( nodes[ n - 1 ].x + nodes[ 0 ].x ) / 2 ) * W;
	const startY = ( ( nodes[ n - 1 ].y + nodes[ 0 ].y ) / 2 ) * H;
	ctx.moveTo( startX, startY );
	for ( let i = 0; i < n; i++ ) {
		const cp   = nodes[ i ];
		const next = nodes[ ( i + 1 ) % n ];
		ctx.quadraticCurveTo( cp.x * W, cp.y * H, ( ( cp.x + next.x ) / 2 ) * W, ( ( cp.y + next.y ) / 2 ) * H );
	}
	ctx.closePath();
}

function buildCirclePath( ctx, nodes, W, H ) {
	const cx = nodes[ 0 ].x * W;
	const cy = nodes[ 0 ].y * H;
	const rx = Math.max( Math.abs( nodes[ 1 ].x - nodes[ 0 ].x ) * W, 1 );
	const ry = Math.max( Math.abs( nodes[ 1 ].y - nodes[ 0 ].y ) * H, 1 );
	ctx.ellipse( cx, cy, rx, ry, 0, 0, Math.PI * 2 );
}

// Builds the area outline for the given shape type; returns false when the
// node count is below the shape's minimum (2 for CIRCLE, 3 otherwise).
function buildAreaPath( ctx, area, W, H ) {
	const nodes     = area.nodes || [];
	const shapeType = area.shapeType || 'POLYGON';
	const minNodes  = shapeType === 'CIRCLE' ? 2 : 3;
	if ( nodes.length < minNodes ) return false;

	ctx.beginPath();
	switch ( shapeType ) {
		case 'BEZIER':
			buildBezierPath( ctx, nodes, W, H );
			break;
		case 'CIRCLE':
			buildCirclePath( ctx, nodes, W, H );
			break;
		default:
			buildPolygonPath( ctx, nodes, W, H );
			break;
	}
	return true;
}

// ── Canvas drawing ────────────────────────────────────────────────────────────

function drawStory( canvas, data, activeNodeId, onImgLoad ) {
	const ctx = canvas.getContext( '2d' );
	if ( ! ctx ) return;

	const W = canvas.width;
	const H = canvas.height;

	ctx.clearRect( 0, 0, W, H );

	const m = data.mapData;

	if ( m?.bgType === 'image' && m.bgImageUrl ) {
		const bg = loadImg( m.bgImageUrl, onImgLoad );
		if ( bg.complete && bg.naturalWidth ) {
			// Cover-fit, centered — matches cns-map-suite's background rendering.
			const scale = Math.max( W / bg.naturalWidth, H / bg.naturalHeight );
			const drawW = bg.naturalWidth  * scale;
			const drawH = bg.naturalHeight * scale;
			ctx.drawImage( bg, ( W - drawW ) / 2, ( H - drawH ) / 2, drawW, drawH );
		} else { ctx.fillStyle = m?.bgColor ?? '#1a1a2e'; ctx.fillRect( 0, 0, W, H ); }
	} else {
		ctx.fillStyle = m?.bgColor ?? '#1a1a2e';
		ctx.fillRect( 0, 0, W, H );
	}

	if ( m?.imageUrl ) {
		const img = loadImg( m.imageUrl, onImgLoad );
		if ( img.complete && img.naturalWidth ) {
			const iw = m.imageW * W;
			ctx.drawImage( img, m.imageX * W, m.imageY * H, iw, ( iw / img.naturalWidth ) * img.naturalHeight );
		}
	}

	if ( m?.areas ) {
		ctx.save();
		for ( const area of m.areas ) {
			if ( ! buildAreaPath( ctx, area, W, H ) ) continue;
			const s = area.canvasStyles;
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
				const img = loadImg( obj.iconUrl, onImgLoad );
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
			// Cascade: node > path > global
			const story   = data.story;
			const pathMap = data._pathMap;
			const path    = node.pathId ? pathMap.get( node.pathId ) : null;

			const mColor = node.markerColor     ?? path?.markerColor     ?? story.markerColor ?? '#00aaff';
			const mSize  = node.markerSize      ?? path?.markerSize      ?? story.markerSize  ?? 5;
			const mOffX  = node.markerIconOffsetX ?? path?.markerIconOffsetX ?? story.markerIconOffsetX ?? 0;
			const mOffY  = node.markerIconOffsetY ?? path?.markerIconOffsetY ?? story.markerIconOffsetY ?? -30;
			const mType  = node.markerType !== 'inherit'
				? node.markerType
				: ( path?.markerType ?? story.markerType ?? 'ring' );
			const mIconUrl = node.markerType === 'icon'
				? ( node.markerIconUrl || path?.markerIconUrl || story.markerIconUrl )
				: node.markerType === 'inherit'
					? ( path?.markerType === 'icon' ? ( path.markerIconUrl || story.markerIconUrl )
						: ( story.markerType === 'icon' ? story.markerIconUrl : '' ) )
					: '';

			if ( mType === 'icon' && mIconUrl ) {
				const mImg = loadImg( mIconUrl, onImgLoad );
				if ( mImg.complete && mImg.naturalWidth ) {
					const mR = r * 0.8;
					ctx.save();
					ctx.globalAlpha = 1;
					ctx.drawImage( mImg, cx + mOffX - mR, cy + mOffY - mR, mR * 2, mR * 2 );
					ctx.restore();
				}
			} else {
				ctx.save(); ctx.beginPath(); ctx.arc( cx, cy, r + mSize, 0, Math.PI * 2 );
				ctx.strokeStyle = mColor; ctx.lineWidth = 3; ctx.setLineDash( [] ); ctx.globalAlpha = 1; ctx.stroke(); ctx.restore();
			}
		}

		// ── Thumbnail ──────────────────────────────────────────────────────
		if ( node.iconType === 'thumbnail' && node.substoryThumbnailUrl ) {
			const img = loadImg( node.substoryThumbnailUrl, onImgLoad );
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
			const img = loadImg( node.iconUrl, onImgLoad );
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

// ── Zoom controls ─────────────────────────────────────────────────────────────
// Same pattern as the cns-map-suite map block: zoom scales the canvas's
// *display* width inside a scroll container; the canvas pixel coordinate
// system is untouched, so the click hit-testing above (normalized by
// getBoundingClientRect) keeps working. The canvas is moved into a dedicated
// scroll div so the +/− buttons, absolutely positioned on the canvas wrap,
// stay put while the zoomed canvas pans.

function setupZoomControls( canvas ) {
	const wrap = canvas.parentElement; // .cns-story-block__canvas-wrap
	if ( ! wrap ) return;

	const scroller = document.createElement( 'div' );
	scroller.className = 'cns-story-canvas-scroll';
	wrap.insertBefore( scroller, canvas );
	scroller.appendChild( canvas );

	const MIN = 1, MAX = 4, STEP = 0.1;
	let zoom = 1;

	const controls = document.createElement( 'div' );
	controls.className = 'cns-story-zoom';
	const zoomIn  = document.createElement( 'button' );
	const zoomOut = document.createElement( 'button' );
	const value   = document.createElement( 'span' );
	zoomIn.type  = 'button';
	zoomOut.type = 'button';
	zoomIn.className  = 'cns-story-zoom__btn';
	zoomOut.className = 'cns-story-zoom__btn';
	zoomIn.textContent  = '+';
	zoomOut.textContent = '−';
	zoomIn.setAttribute( 'aria-label', 'Zoom map in' );
	zoomOut.setAttribute( 'aria-label', 'Zoom map out' );
	value.className = 'cns-story-zoom__value';
	controls.appendChild( zoomIn );
	controls.appendChild( value );
	controls.appendChild( zoomOut );
	wrap.appendChild( controls );

	function render() {
		value.textContent = Math.round( zoom * 100 ) + '%';
		zoomIn.disabled  = zoom >= MAX;
		zoomOut.disabled = zoom <= MIN;
	}

	function apply( next ) {
		// Round to one decimal so repeated 0.1 steps don't accumulate
		// float drift (1.7000000000000002).
		next = Math.min( MAX, Math.max( MIN, Math.round( next * 10 ) / 10 ) );
		if ( next === zoom ) return;
		// Keep the viewport centered on the same map point.
		const cx = ( scroller.scrollLeft + scroller.clientWidth / 2 ) / zoom;
		const cy = ( scroller.scrollTop + scroller.clientHeight / 2 ) / zoom;
		zoom = next;
		if ( zoom > 1 ) {
			canvas.style.maxWidth = 'none';
			canvas.style.width    = ( zoom * 100 ) + '%';
			scroller.classList.add( 'is-zoomed' );
		} else {
			canvas.style.maxWidth = '100%';
			canvas.style.width    = '';
			scroller.classList.remove( 'is-zoomed' );
		}
		render();
		scroller.scrollLeft = cx * zoom - scroller.clientWidth / 2;
		scroller.scrollTop  = cy * zoom - scroller.clientHeight / 2;
	}

	zoomIn.addEventListener( 'click', () => apply( zoom + STEP ) );
	zoomOut.addEventListener( 'click', () => apply( zoom - STEP ) );
	render();
}

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

	setupZoomControls( canvas );

	// Build a Map of pathId → path for O(1) lookup during drawing.
	data._pathMap = new Map( ( data.paths ?? [] ).map( ( p ) => [ p.id, p ] ) );

	let activeNodeId = data.story.startNodeId ?? ( data.nodes[ 0 ]?.id ?? null );
	const expandedIds = new Set();

	// Coalesce redraw requests into one paint per frame. Used as the image
	// onload callback, so the canvas repaints exactly when assets arrive —
	// no free-running animation loop.
	let redrawQueued = false;
	function scheduleRedraw() {
		if ( redrawQueued ) return;
		redrawQueued = true;
		requestAnimationFrame( () => {
			redrawQueued = false;
			redraw();
		} );
	}

	function redraw()   { drawStory( canvas, data, activeNodeId, scheduleRedraw ); }
	function rerender() { renderWindow( windowEl, data, activeNodeId, expandedIds ); redraw(); }

	// Preload images then start loop.
	const urls = [];
	if ( m?.bgImageUrl ) urls.push( m.bgImageUrl );
	if ( m?.imageUrl   ) urls.push( m.imageUrl   );
	( m?.objects ?? [] ).forEach( ( o ) => { if ( o.iconUrl ) urls.push( o.iconUrl ); } );
	if ( data.story.markerIconUrl ) urls.push( data.story.markerIconUrl );
	( data.paths ?? [] ).forEach( ( p ) => { if ( p.markerIconUrl ) urls.push( p.markerIconUrl ); } );
	data.nodes.forEach( ( n ) => {
		if ( n.iconUrl ) urls.push( n.iconUrl );
		if ( n.substoryThumbnailUrl ) urls.push( n.substoryThumbnailUrl );
		if ( n.markerIconUrl ) urls.push( n.markerIconUrl );
	} );

	urls.forEach( ( url ) => { loadImg( url, scheduleRedraw ); } );

	// Canvas click — check map objects/areas first, then select story node.
	canvas.addEventListener( 'click', ( e ) => {
		const rect   = canvas.getBoundingClientRect();
		const scaleX = canvas.width  / rect.width;
		const scaleY = canvas.height / rect.height;
		const mx = ( e.clientX - rect.left ) * scaleX;
		const my = ( e.clientY - rect.top  ) * scaleY;

		if ( m?.objects ) {
			const mapW = m.width;
			const mapH = mapW * m.aspectRatio;
			for ( const obj of m.objects ) {
				if ( ! obj.infoboxResolved ) continue;
				const cx   = ( obj.x / mapW ) * canvas.width;
				const cy   = ( obj.y / mapH ) * canvas.height;
				const r    = ( ( obj.canvasStyles?.size ?? 32 ) * ( canvas.width / mapW ) ) / 2;
				if ( ( mx - cx ) ** 2 + ( my - cy ) ** 2 <= r ** 2 ) {
					showInfobox( obj );
					return;
				}
			}
		}

		if ( m?.areas ) {
			const ctx2 = canvas.getContext( '2d' );
			for ( const area of m.areas ) {
				if ( ! area.infoboxResolved ) continue;
				if ( ! buildAreaPath( ctx2, area, canvas.width, canvas.height ) ) continue;
				if ( ctx2.isPointInPath( mx, my ) ) {
					showInfobox( area );
					return;
				}
			}
		}

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
