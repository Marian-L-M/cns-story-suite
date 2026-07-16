import { useState, useEffect } from '@wordpress/element';
import {
	RangeControl,
	SelectControl,
	__experimentalNumberControl as NumberControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import ColorField from './shared/ColorField';
import Notices from './shared/Notices';
import EditorHeader from './EditorHeader';
import TabBar from './TabBar';
import StoryCanvas from '../canvas/StoryCanvas';
import CanvasNodeList from './CanvasNodeList';
import SettingsPanel from './panels/SettingsPanel';
import NodesPanel from './panels/NodesPanel';
import PathsPanel from './panels/PathsPanel';
import LinksPanel from './panels/LinksPanel';
import NodeModal from './forms/NodeModal';
import EdgeStyleModal from './forms/EdgeStyleModal';
import { apiFetch } from '../utils';
import type {
	StorySettings, StoryNode, StoryEdge, StoryLink, StoryPath,
	MapRenderData, MapObjectRef, MapAreaRef,
	LineStyle, PostStatus, StoryTab, NodeFormData, EdgeFormData, PathFormData, CanvasMode,
} from '../../types';

interface NodeModalState {
	open:  boolean;
	nodeId: number | null; // null = new node
	x:     number;
	y:     number;
}

function buildInitialSettings(): StorySettings {
	const d = window.cnsStoryEditor || ( {} as typeof window.cnsStoryEditor );
	return {
		title:           d.title    ?? '',
		status:          d.status   ?? 'draft',
		mapId:           null,
		mapTitle:        '',
		lineColor:       '#ffffff',
		lineWidth:       3,
		lineStyle:       'solid',
		lineOpacity:     1.0,
		startNodeId:     null,
		viewUrl:         d.viewUrl  ?? '',
		thumbnailId:     null,
		thumbnailUrl:    '',
		description:     '',
		markerColor:       '#00aaff',
		markerSize:        5,
		markerType:        'ring',
		markerIconId:      null,
		markerIconUrl:     '',
		markerIconOffsetX: 0,
		markerIconOffsetY: -30,
	};
}

export default function StoryEditorApp() {
	const d       = window.cnsStoryEditor || ( {} as typeof window.cnsStoryEditor );
	const storyId = d.storyId  || 0;
	const isNew   = d.isNew    || false;

	const [ settings,        setSettings        ] = useState< StorySettings >( buildInitialSettings );
	const [ nodes,           setNodes           ] = useState< StoryNode[] >( [] );
	const [ edges,           setEdges           ] = useState< StoryEdge[] >( [] );
	const [ paths,           setPaths           ] = useState< StoryPath[] >( [] );
	const [ links,           setLinks           ] = useState< StoryLink[] >( [] );
	const [ mapData,         setMapData         ] = useState< MapRenderData | null >( null );
	const [ mapObjects,      setMapObjects      ] = useState< MapObjectRef[] >( [] );
	const [ mapAreas,        setMapAreas        ] = useState< MapAreaRef[] >( [] );
	const [ activeTab,       setActiveTab       ] = useState< StoryTab >( 'settings' );
	const [ selectedNodeId,  setSelectedNodeId  ] = useState< number | null >( null );
	const [ canvasMode,      setCanvasMode      ] = useState< CanvasMode >( 'select' );
	const [ edgeStartNodeId, setEdgeStartNodeId ] = useState< number | null >( null );
	const [ isSaving,        setIsSaving        ] = useState( false );
	const [ nodeModal,       setNodeModal       ] = useState< NodeModalState >( { open: false, nodeId: null, x: 0.5, y: 0.5 } );
	const [ edgeModal,       setEdgeModal       ] = useState< { open: boolean; edgeId: number | null } >( { open: false, edgeId: null } );
	const [ loading,         setLoading         ] = useState( ! isNew );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	// ── Initial data load ─────────────────────────────────────────────────────

	useEffect( () => {
		if ( isNew ) return;
		( async () => {
			try {
				const data = await apiFetch< {
					story:   StorySettings & { id: number };
					mapData: MapRenderData | null;
					nodes:   StoryNode[];
					edges:   StoryEdge[];
					paths:   StoryPath[];
				} >( 'GET', `/stories/${ storyId }/data` );
				setSettings( data.story );
				setNodes( data.nodes );
				setEdges( data.edges );
				setPaths( data.paths ?? [] );
				if ( data.mapData ) {
					setMapData( data.mapData );
					setMapObjects( data.mapData.objects );
					setMapAreas( data.mapData.areas );
				}
			} catch {
				/* load failures leave the editor empty, as before */
			}
			try {
				setLinks( await apiFetch< StoryLink[] >( 'GET', `/stories/${ storyId }/links` ) );
			} catch {
				/* ignore */
			}
			setLoading( false );
		} )();
	}, [] );

	// ── Save story settings ───────────────────────────────────────────────────

	async function handleSave() {
		setIsSaving( true );
		try {
			const data = await apiFetch< {
				created?: boolean;
				editUrl?: string;
				viewUrl?: string;
			} >( 'POST', '/stories', {
				story_id:           storyId,
				title:              settings.title,
				description:        settings.description,
				status:             settings.status,
				map_id:             settings.mapId ?? 0,
				line_color:         settings.lineColor,
				line_width:         settings.lineWidth,
				line_style:         settings.lineStyle,
				line_opacity:       settings.lineOpacity,
				start_node_id:      settings.startNodeId ?? 0,
				thumbnail_id:       settings.thumbnailId ?? 0,
				marker_color:          settings.markerColor,
				marker_size:           settings.markerSize,
				marker_type:           settings.markerType,
				marker_icon_id:        settings.markerIconId ?? 0,
				marker_icon_offset_x:  settings.markerIconOffsetX,
				marker_icon_offset_y:  settings.markerIconOffsetY,
			} );
			if ( data.created && data.editUrl ) {
				window.location.href = data.editUrl;
			} else {
				if ( data.viewUrl !== undefined ) {
					setSettings( ( p ) => ( { ...p, viewUrl: data.viewUrl! } ) );
				}
				createSuccessNotice( __( 'Story saved.', 'cns-story-suite' ), {
					type: 'snackbar',
				} );
			}
		} catch ( err ) {
			createErrorNotice(
				( err as Error ).message || __( 'Save failed.', 'cns-story-suite' ),
				{ type: 'snackbar' }
			);
		} finally {
			setIsSaving( false );
		}
	}

	// ── Map data reload when mapId changes ────────────────────────────────────

	async function handleMapChange( mapId: number | null, mapTitle: string ) {
		setSettings( ( p ) => ( { ...p, mapId, mapTitle } ) );
		if ( ! mapId ) {
			setMapData( null ); setMapObjects( [] ); setMapAreas( [] );
			return;
		}
		// Reload full story data to get map render data.
		if ( ! isNew && storyId ) {
			try {
				const data = await apiFetch< { mapData: MapRenderData | null } >(
					'GET',
					`/stories/${ storyId }/data`
				);
				if ( data.mapData ) {
					setMapData( data.mapData );
					setMapObjects( data.mapData.objects );
					setMapAreas( data.mapData.areas );
				}
			} catch {
				/* ignore — canvas keeps the previous base map */
			}
		}
	}

	// ── Node operations ───────────────────────────────────────────────────────

	async function handleNodeCreate( formData: NodeFormData, x: number, y: number ) {
		try {
			const node = await apiFetch< StoryNode >( 'POST', `/stories/${ storyId }/nodes`, {
			x, y,
			path_id:              formData.pathId ?? 0,
			substory_id:          formData.substoryId ?? 0,
			title_override:       formData.titleOverride   || null,
			excerpt_override:     formData.excerptOverride || null,
			icon_type:            formData.iconType,
			icon_id:              formData.iconId ?? 0,
			icon_color:           formData.iconColor,
			icon_size:            formData.iconSize,
			icon_border_color:    formData.iconBorderColor,
			icon_border_width:    formData.iconBorderWidth,
			icon_bg_color:        formData.iconBgColor,
			icon_bg_shape:        formData.iconBgShape,
			marker_type:          formData.markerType,
			marker_icon_id:       formData.markerIconId ?? 0,
			marker_color:         formData.markerColor,
			marker_size:          formData.markerSize,
			marker_icon_offset_x: formData.markerIconOffsetX,
			marker_icon_offset_y: formData.markerIconOffsetY,
			} );
			setNodes( ( p ) => [ ...p, node ] );
			return node;
		} catch {
			/* create failures are silent, as before */
		}
	}

	async function handleNodeUpdate( nodeId: number, formData: NodeFormData ) {
		try {
			const updated = await apiFetch< StoryNode >( 'PATCH', `/nodes/${ nodeId }`, {
			x:                    formData.x,
			y:                    formData.y,
			path_id:              formData.pathId ?? 0,
			substory_id:          formData.substoryId ?? 0,
			title_override:       formData.titleOverride   || null,
			excerpt_override:     formData.excerptOverride || null,
			icon_type:            formData.iconType,
			icon_id:              formData.iconId ?? 0,
			icon_color:           formData.iconColor,
			icon_size:            formData.iconSize,
			icon_border_color:    formData.iconBorderColor,
			icon_border_width:    formData.iconBorderWidth,
			icon_bg_color:        formData.iconBgColor,
			icon_bg_shape:        formData.iconBgShape,
			marker_type:          formData.markerType,
			marker_icon_id:       formData.markerIconId ?? 0,
			marker_color:         formData.markerColor,
			marker_size:          formData.markerSize,
			marker_icon_offset_x: formData.markerIconOffsetX,
			marker_icon_offset_y: formData.markerIconOffsetY,
			} );
			setNodes( ( p ) => p.map( ( n ) => ( n.id === nodeId ? updated : n ) ) );
		} catch {
			/* update failures are silent, as before */
		}
	}

	async function handleNodeDelete( nodeId: number ) {
		try {
			await apiFetch( 'DELETE', `/nodes/${ nodeId }` );
			setNodes( ( p ) => p.filter( ( n ) => n.id !== nodeId ) );
			setEdges( ( p ) => p.filter( ( e ) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId ) );
			if ( selectedNodeId === nodeId )  setSelectedNodeId( null );
		} catch {
			/* delete failures are silent, as before */
		}
	}

	async function handleNodeDragEnd( nodeId: number, x: number, y: number ) {
		try {
			const updated = await apiFetch< StoryNode >( 'PATCH', `/nodes/${ nodeId }`, { x, y } );
			setNodes( ( p ) => p.map( ( n ) => ( n.id === nodeId ? updated : n ) ) );
		} catch {
			/* position patches fail silently, as before */
		}
	}

	// ── Edge operations ───────────────────────────────────────────────────────

	async function handleEdgeCreate( fromId: number, toId: number ) {
		try {
			const edge = await apiFetch< StoryEdge >( 'POST', '/edges', {
				story_id:    storyId,
				from_node_id: fromId,
				to_node_id:  toId,
			} );
			setEdges( ( p ) => {
				// Replace if a duplicate edge is returned.
				const filtered = p.filter( ( e ) => e.id !== edge.id );
				return [ ...filtered, edge ];
			} );
		} catch {
			/* create failures are silent, as before */
		}
	}

	async function handleEdgeDelete( edgeId: number ) {
		try {
			await apiFetch( 'DELETE', `/edges/${ edgeId }` );
			setEdges( ( p ) => p.filter( ( e ) => e.id !== edgeId ) );
		} catch {
			/* delete failures are silent, as before */
		}
	}

	async function handleEdgeUpdate( edgeId: number, formData: EdgeFormData ) {
		try {
			const updated = await apiFetch< StoryEdge >( 'PATCH', `/edges/${ edgeId }`, {
				line_color:   formData.lineColor,
				line_width:   formData.lineWidth,
				line_style:   formData.lineStyle,
				line_opacity: formData.lineOpacity,
			} );
			setEdges( ( p ) => p.map( ( e ) => ( e.id === edgeId ? updated : e ) ) );
		} catch {
			/* update failures are silent, as before */
		}
	}

	// ── Path operations ───────────────────────────────────────────────────────

	async function handlePathCreate( data: PathFormData ) {
		try {
			const path = await apiFetch< StoryPath >( 'POST', `/stories/${ storyId }/paths`, {
				label:               data.label,
				marker_color:        data.markerColor,
				marker_size:         data.markerSize,
				marker_type:         data.markerType,
				marker_icon_id:      data.markerIconId ?? 0,
				marker_icon_offset_x: data.markerIconOffsetX,
				marker_icon_offset_y: data.markerIconOffsetY,
			} );
			setPaths( ( p ) => [ ...p, path ] );
		} catch {
			/* create failures are silent, as before */
		}
	}

	async function handlePathUpdate( pathId: number, data: PathFormData ) {
		try {
			const updated = await apiFetch< StoryPath >( 'PATCH', `/paths/${ pathId }`, {
				label:               data.label,
				marker_color:        data.markerColor,
				marker_size:         data.markerSize,
				marker_type:         data.markerType,
				marker_icon_id:      data.markerIconId ?? 0,
				marker_icon_offset_x: data.markerIconOffsetX,
				marker_icon_offset_y: data.markerIconOffsetY,
			} );
			setPaths( ( p ) => p.map( ( path ) => ( path.id === pathId ? updated : path ) ) );
		} catch {
			/* update failures are silent, as before */
		}
	}

	async function handlePathDelete( pathId: number ) {
		try {
			await apiFetch( 'DELETE', `/paths/${ pathId }` );
			setPaths( ( p ) => p.filter( ( path ) => path.id !== pathId ) );
			// Clear pathId on nodes that belonged to this path.
			setNodes( ( ns ) => ns.map( ( n ) => n.pathId === pathId ? { ...n, pathId: null } : n ) );
		} catch {
			/* delete failures are silent, as before */
		}
	}

	// ── Link operations ───────────────────────────────────────────────────────

	async function handleLinkAdd( linkType: string, linkId: number ) {
		try {
			const storyLink = await apiFetch< StoryLink >(
				'POST',
				`/stories/${ storyId }/links`,
				{ link_type: linkType, link_id: linkId }
			);
			setLinks( ( p ) => {
				const filtered = p.filter( ( l ) => l.id !== storyLink.id );
				return [ ...filtered, storyLink ];
			} );
		} catch {
			/* create failures are silent, as before */
		}
	}

	async function handleLinkDelete( linkId: number ) {
		try {
			await apiFetch( 'DELETE', `/links/${ linkId }` );
			setLinks( ( p ) => p.filter( ( l ) => l.id !== linkId ) );
		} catch {
			/* delete failures are silent, as before */
		}
	}

	// ── Edge reorder ─────────────────────────────────────────────────────────

	async function handleEdgeReorder( edgeId: number, sortOrder: number ) {
		try {
			const updated = await apiFetch< StoryEdge >( 'PATCH', `/edges/${ edgeId }`, { sort_order: sortOrder } );
			setEdges( ( p ) => p.map( ( e ) => ( e.id === edgeId ? updated : e ) ) );
		} catch {
			/* reorder failures are silent, as before */
		}
	}

	// ── Canvas mode key handler ───────────────────────────────────────────────

	useEffect( () => {
		if ( canvasMode !== 'connect' ) return;
		function onKey( e: KeyboardEvent ) {
			if ( e.key === 'Escape' || e.key === 'Enter' ) {
				setCanvasMode( 'select' );
				setEdgeStartNodeId( null );
			}
		}
		document.addEventListener( 'keydown', onKey );
		return () => document.removeEventListener( 'keydown', onKey );
	}, [ canvasMode ] );

	// ── Canvas interaction ────────────────────────────────────────────────────

	function exitConnectMode() {
		setCanvasMode( 'select' );
		setEdgeStartNodeId( null );
	}

	function handleNodeClick( nodeId: number ) {
		if ( canvasMode === 'connect' ) {
			if ( edgeStartNodeId === null || edgeStartNodeId === nodeId ) {
				exitConnectMode();
			} else {
				handleEdgeCreate( edgeStartNodeId, nodeId );
				setEdgeStartNodeId( nodeId );
				setSelectedNodeId( nodeId );
			}
		} else {
			setSelectedNodeId( nodeId );
		}
	}

	function handleCanvasClick( x: number, y: number ) {
		if ( canvasMode === 'connect' ) {
			exitConnectMode();
			return;
		}
		if ( isNew ) {
			createErrorNotice(
				__( 'Save the story first before adding nodes.', 'cns-story-suite' ),
				{ type: 'snackbar' }
			);
			return;
		}
		if ( canvasMode === 'select' && selectedNodeId !== null ) {
			handleNodeDragEnd( selectedNodeId, x, y );
			setSelectedNodeId( null );
			return;
		}
		if ( canvasMode === 'add' ) {
			setNodeModal( { open: true, nodeId: null, x, y } );
		}
	}

	function handleEdgeClick( edgeId: number ) {
		setEdgeModal( { open: true, edgeId } );
	}

	function handleStartEdgeFrom( fromNodeId: number ) {
		setSelectedNodeId( fromNodeId );
		setEdgeStartNodeId( fromNodeId );
		setCanvasMode( 'connect' );
	}

	// ── Modal save ────────────────────────────────────────────────────────────

	async function handleModalSave( formData: NodeFormData ) {
		if ( nodeModal.nodeId === null ) {
			await handleNodeCreate( formData, formData.x, formData.y );
		} else {
			await handleNodeUpdate( nodeModal.nodeId, formData );
		}
		setNodeModal( { open: false, nodeId: null, x: 0, y: 0 } );
		setSelectedNodeId( null );
	}

	// ── Tab change ────────────────────────────────────────────────────────────

	function handleTabChange( tab: StoryTab ) {
		if ( tab !== 'canvas' ) {
			exitConnectMode();
			setSelectedNodeId( null );
		}
		setActiveTab( tab );
	}

	// ── Render ────────────────────────────────────────────────────────────────

	const pageTitle = isNew ? 'New Story' : `Edit: ${ settings.title || '(no title)' }`;
	const selectedNode = nodes.find( ( n ) => n.id === selectedNodeId ) ?? null;

	if ( loading ) {
		return <div className="cns-story-editor"><div className="cns-loading">Loading…</div></div>;
	}

	return (
		<div className="cns-story-editor cns-map-editor">
			<EditorHeader
				pageTitle={ pageTitle }
				overviewUrl={ d.overviewUrl || '#' }
				viewUrl={ ! isNew ? settings.viewUrl : '' }
				status={ settings.status }
				isSaving={ isSaving }
				onStatusChange={ ( s: PostStatus ) => setSettings( ( p ) => ( { ...p, status: s } ) ) }
				onSave={ handleSave }
			/>

			<div className="cns-map-editor__main">
				<div className="cns-map-editor__body">
					<TabBar activeTab={ activeTab } onChange={ handleTabChange } />

					<div className="cns-map-editor__content">
						{ activeTab === 'settings' && (
							<SettingsPanel
								settings={ settings }
								onChange={ setSettings }
								onMapChange={ handleMapChange }
							/>
						) }

						{ activeTab === 'canvas' && (
							<div className="cns-story-canvas-view">
								<div className="cns-story-canvas-toolbar">
									<div className="cns-story-canvas-toolbar__row">
										{ ! isNew && (
											<ToggleGroupControl
												__next40pxDefaultSize
												__nextHasNoMarginBottom
												label={ __( 'Canvas mode', 'cns-story-suite' ) }
												hideLabelFromVision
												value={ canvasMode }
												isAdaptiveWidth
												onChange={ ( value ) => {
													const mode = ( value ?? 'select' ) as CanvasMode;
													if ( mode === 'connect' ) {
														setEdgeStartNodeId( selectedNodeId );
													} else {
														setEdgeStartNodeId( null );
													}
													setCanvasMode( mode );
												} }
											>
												<ToggleGroupControlOption
													value="select"
													label={ __( 'Select', 'cns-story-suite' ) }
												/>
												<ToggleGroupControlOption
													value="add"
													label={ __( 'Add', 'cns-story-suite' ) }
												/>
												<ToggleGroupControlOption
													value="connect"
													label={ __( 'Connect', 'cns-story-suite' ) }
												/>
											</ToggleGroupControl>
										) }
										{ canvasMode === 'connect' && (
											<span className="cns-story-canvas-toolbar__hint">
												{ edgeStartNodeId === null
													? 'Click a node to start a path'
													: 'Click next node · Enter or Esc to finish' }
											</span>
										) }
										{ canvasMode === 'select' && selectedNodeId !== null && (
											<span className="cns-story-canvas-toolbar__hint">
												Click canvas to move here
											</span>
										) }
										{ canvasMode === 'add' && (
											<span className="cns-story-canvas-toolbar__hint">
												Click canvas to place a new node
											</span>
										) }
									</div>

									<div className="cns-story-canvas-toolbar__row cns-story-canvas-toolbar__line-style">
										<span className="cns-story-canvas-toolbar__label">
											{ __( 'Lines:', 'cns-story-suite' ) }
										</span>
										<ColorField
											label={ __( 'Color', 'cns-story-suite' ) }
											value={ settings.lineColor }
											onChange={ ( v ) => setSettings( ( p ) => ( { ...p, lineColor: v } ) ) }
										/>
										<NumberControl
											size="small"
											label={ __( 'Width (px)', 'cns-story-suite' ) }
											min={ 0.5 } max={ 20 } step={ 0.5 }
											value={ settings.lineWidth }
											onChange={ ( v ) =>
												setSettings( ( p ) => ( { ...p, lineWidth: parseFloat( v ?? '' ) || p.lineWidth } ) )
											}
											style={ { width: 70 } }
										/>
										<SelectControl
											__nextHasNoMarginBottom
											size="small"
											label={ __( 'Style', 'cns-story-suite' ) }
											value={ settings.lineStyle }
											options={ [
												{ value: 'solid',  label: __( 'Solid', 'cns-story-suite' ) },
												{ value: 'dashed', label: __( 'Dashed', 'cns-story-suite' ) },
												{ value: 'dotted', label: __( 'Dotted', 'cns-story-suite' ) },
											] }
											onChange={ ( v ) => setSettings( ( p ) => ( { ...p, lineStyle: v as LineStyle } ) ) }
										/>
										<div className="cns-story-canvas-toolbar__opacity">
											<RangeControl
												__nextHasNoMarginBottom
												label={ __( 'Opacity', 'cns-story-suite' ) }
												min={ 0 } max={ 1 } step={ 0.05 }
												withInputField={ false }
												value={ settings.lineOpacity }
												onChange={ ( v ) =>
													setSettings( ( p ) => ( { ...p, lineOpacity: v ?? 1 } ) )
												}
											/>
											<span>{ Math.round( settings.lineOpacity * 100 ) }%</span>
										</div>
									</div>
								</div>

								<div className="cns-story-canvas-layout">
									<div className="cns-story-canvas-main">
										<div className="cns-story-canvas-wrap">
											<StoryCanvas
												mapData={ mapData }
												mapObjects={ mapObjects }
												mapAreas={ mapAreas }
												nodes={ nodes }
												edges={ edges }
												paths={ paths }
												selectedNodeId={ selectedNodeId }
												edgeStartNodeId={ edgeStartNodeId }
												isEdgeMode={ canvasMode === 'connect' }
												lineColor={ settings.lineColor }
												lineWidth={ settings.lineWidth }
												lineStyle={ settings.lineStyle }
												lineOpacity={ settings.lineOpacity }
												markerColor={ settings.markerColor }
												markerSize={ settings.markerSize }
												markerType={ settings.markerType }
												markerIconUrl={ settings.markerIconUrl }
												markerIconOffsetX={ settings.markerIconOffsetX }
												markerIconOffsetY={ settings.markerIconOffsetY }
												onNodeClick={ handleNodeClick }
												onCanvasClick={ handleCanvasClick }
												onEdgeClick={ handleEdgeClick }
												onNodeDragEnd={ handleNodeDragEnd }
											/>
										</div>
									</div>

									<div className="cns-story-window-panel">
										<CanvasNodeList
											nodes={ nodes }
											edges={ edges }
											startNodeId={ settings.startNodeId }
											selectedNodeId={ selectedNodeId }
											onSelect={ ( id ) => setSelectedNodeId( id ) }
											onEdit={ ( id ) => {
												setSelectedNodeId( id );
												setNodeModal( { open: true, nodeId: id, x: 0, y: 0 } );
											} }
											onDelete={ handleNodeDelete }
											onSetStartNode={ ( id ) => setSettings( ( p ) => ( { ...p, startNodeId: id } ) ) }
											onEdgeReorder={ handleEdgeReorder }
											onEdgeDelete={ handleEdgeDelete }
											onStartEdgeFrom={ handleStartEdgeFrom }
											onEditEdge={ ( edgeId ) => setEdgeModal( { open: true, edgeId } ) }
										/>
									</div>
								</div>
							</div>
						) }

						{ activeTab === 'nodes' && (
							<NodesPanel
								nodes={ nodes }
								edges={ edges }
								paths={ paths }
								startNodeId={ settings.startNodeId }
								onEditNode={ ( id ) => {
									setSelectedNodeId( id );
									setNodeModal( { open: true, nodeId: id, x: 0, y: 0 } );
								} }
								onDeleteNode={ handleNodeDelete }
								onSetStartNode={ ( id ) => setSettings( ( p ) => ( { ...p, startNodeId: id } ) ) }
								onEdgeReorder={ handleEdgeReorder }
								onEdgeDelete={ handleEdgeDelete }
								onEditEdge={ ( id ) => setEdgeModal( { open: true, edgeId: id } ) }
							/>
						) }

						{ activeTab === 'paths' && (
							<PathsPanel
								paths={ paths }
								onCreatePath={ handlePathCreate }
								onUpdatePath={ handlePathUpdate }
								onDeletePath={ handlePathDelete }
							/>
						) }

						{ activeTab === 'links' && ! isNew && (
							<LinksPanel
								storyId={ storyId }
								links={ links }
								onLinkAdd={ handleLinkAdd }
								onLinkDelete={ handleLinkDelete }
							/>
						) }

						{ activeTab === 'links' && isNew && (
							<div className="cns-panel-notice">Save the story first to manage links.</div>
						) }
					</div>
				</div>
			</div>

			{ nodeModal.open && (
				<NodeModal
					nodeId={ nodeModal.nodeId }
					existingNode={ selectedNode }
					initialX={ nodeModal.x }
					initialY={ nodeModal.y }
					paths={ paths }
					onSave={ handleModalSave }
					onClose={ () => {
						setNodeModal( { open: false, nodeId: null, x: 0, y: 0 } );
						setSelectedNodeId( null );
					} }
				/>
			) }

			{ edgeModal.open && ( () => {
				const edge = edges.find( e => e.id === edgeModal.edgeId );
				return edge ? (
					<EdgeStyleModal
						edge={ edge }
						storyColor={ settings.lineColor }
						storyWidth={ settings.lineWidth }
						storyStyle={ settings.lineStyle }
						storyOpacity={ settings.lineOpacity }
						onSave={ handleEdgeUpdate }
						onDelete={ handleEdgeDelete }
						onClose={ () => setEdgeModal( { open: false, edgeId: null } ) }
					/>
				) : null;
			} )() }

			<Notices />
		</div>
	);
}
