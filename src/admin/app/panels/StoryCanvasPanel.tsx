import {
    RangeControl,
    SelectControl,
    __experimentalNumberControl as NumberControl,
    __experimentalToggleGroupControl as ToggleGroupControl,
    __experimentalToggleGroupControlOption as ToggleGroupControlOption,
    Flex,
    Button,
    Popover,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import CanvasNodeList from '../CanvasNodeList';
import StoryCanvas from '../../canvas/StoryCanvas';
import ColorField from '../shared/ColorField';

import type {
	StorySettings, StoryNode, StoryEdge, StoryPath,
	MapRenderData, MapObjectRef, MapAreaRef,
	LineStyle, CanvasMode,
} from '../../../types';
import { useState } from '@wordpress/element';


interface Props {
	isNew:           boolean;
	settings:        StorySettings;
	nodes:           StoryNode[];
	edges:           StoryEdge[];
	paths:           StoryPath[];
	mapData:         MapRenderData | null;
	mapObjects:      MapObjectRef[];
	mapAreas:        MapAreaRef[];
	canvasMode:      CanvasMode;
	selectedNodeId:  number | null;
	edgeStartNodeId: number | null;

	onSettingsChange:   ( s: StorySettings ) => void;
	onCanvasModeChange: ( mode: CanvasMode ) => void;
	onNodeClick:        ( nodeId: number ) => void;
	onCanvasClick:      ( x: number, y: number ) => void;
	onEdgeClick:        ( edgeId: number ) => void;
	onNodeDragEnd:      ( nodeId: number, x: number, y: number ) => void;
	onSelectNode:       ( nodeId: number ) => void;
	onEditNode:         ( nodeId: number ) => void;
	onDeleteNode:       ( nodeId: number ) => void;
	onSetStartNode:     ( nodeId: number ) => void;
	onEdgeReorder:      ( edgeId: number, sortOrder: number ) => void;
	onEdgeDelete:       ( edgeId: number ) => void;
	onStartEdgeFrom:    ( fromNodeId: number ) => void;
	onEditEdge:         ( edgeId: number ) => void;
}


export default function StoryCanvasPanel( {
	isNew, settings, nodes, edges, paths,
	mapData, mapObjects, mapAreas,
	canvasMode, selectedNodeId, edgeStartNodeId,
	onSettingsChange, onCanvasModeChange,
	onNodeClick, onCanvasClick, onEdgeClick, onNodeDragEnd,
	onSelectNode, onEditNode, onDeleteNode, onSetStartNode,
	onEdgeReorder, onEdgeDelete, onStartEdgeFrom, onEditEdge,
}: Props ) {
    function set< K extends keyof StorySettings >( key: K, value: StorySettings[ K ] ) {
		onSettingsChange( { ...settings, [ key ]: value } );
	}
    // Help information
	const [ isVisibleHelpInformation, setIsVisibleHelpInformation ] =
		useState( false );
    const toggleVisibleHelpInformation = () => {
		setIsVisibleHelpInformation( ( state: boolean ) => ! state );
	};

    return(
        <div className="cns-story-canvas-view">
            <div className="cns-story-canvas-toolbar">
                <div className="cns-story-canvas-toolbar__row">
                    { ! isNew && (
                        <ToggleGroupControl
                            __next40pxDefaultSize
                            label={ __( 'Canvas mode', 'cns-story-suite' ) }
                            hideLabelFromVision
                            value={ canvasMode }
                            isAdaptiveWidth
                            onChange={ ( value ) => onCanvasModeChange( ( value ?? 'select' ) as CanvasMode )}
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
                    <Button 
                        variant="tertiary" 
                        onClick={ toggleVisibleHelpInformation }
                        >
                        Help Information
                        { isVisibleHelpInformation && (
                            <Popover
                                headerTitle="Help Information"
                                expandOnMobile
                            >
                                <ol
                                    style={ {
                                        width: 320,
                                        maxWidth: '100%',
                                    } }
                                >
                                    <li>
                                        <h4>Connect Mode</h4>
                                        <ul>
                                            <li>  { __('Click a node to start a path.','cns-map-suite') }</li>
                                            <li>  { __('When path is active, click next node or press Enter/Esc to finish.','cns-map-suite') }</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <h4>Select Mode</h4>
                                        <ul>
                                            <li>  { __('Click canvas to move node','cns-map-suite') }</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <h4>Add Mode</h4>
                                        <ul>
                                            <li>  { __('Click canvas to place a new node','cns-map-suite') }</li>
                                        </ul>
                                    </li>
                                </ol>
                            </Popover>
                        ) }
                    </Button>

                </div>

                <div className="cns-story-canvas-toolbar__row cns-story-canvas-toolbar__line-style">
                    <span className="cns-story-canvas-toolbar__label">
                        { __( 'Lines:', 'cns-story-suite' ) }
                    </span>
                    <ColorField
                        label={ __( 'Color', 'cns-story-suite' ) }
                        value={ settings.lineColor }
                        onChange={ ( v ) => set( 'lineColor', v ) }
                    />
                    <NumberControl
                        size="small"
                        label={ __( 'Width (px)', 'cns-story-suite' ) }
                        min={ 0.5 } max={ 20 } step={ 0.5 }
                        value={ settings.lineWidth }
                        onChange={ ( v ) => set( 'lineWidth', parseFloat( v ?? '' ) || settings.lineWidth )}
                        style={ { width: 70 } }
                    />
                    <SelectControl
                        size="small"
                        label={ __( 'Style', 'cns-story-suite' ) }
                        value={ settings.lineStyle }
                        options={ [
                            { value: 'solid',  label: __( 'Solid', 'cns-story-suite' ) },
                            { value: 'dashed', label: __( 'Dashed', 'cns-story-suite' ) },
                            { value: 'dotted', label: __( 'Dotted', 'cns-story-suite' ) },
                        ] }
                        onChange={ ( v ) => set( 'lineStyle', v as LineStyle ) }
                    />
                    <div className="cns-story-canvas-toolbar__opacity">
                        <RangeControl
                            label={ __( 'Opacity', 'cns-story-suite' ) }
                            min={ 0 } max={ 1 } step={ 0.05 }
                            withInputField={ false }
                            value={ settings.lineOpacity }
                            onChange={ ( v ) => set( 'lineOpacity', v ?? 1 ) }
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
							onNodeClick={ onNodeClick }
							onCanvasClick={ onCanvasClick }
							onEdgeClick={ onEdgeClick }
							onNodeDragEnd={ onNodeDragEnd }
                        />
                    </div>
                </div>

                <div className="cns-story-window-panel">
                    <CanvasNodeList
                        nodes={ nodes }
						edges={ edges }
						startNodeId={ settings.startNodeId }
						selectedNodeId={ selectedNodeId }
						onSelect={ onSelectNode }
						onEdit={ onEditNode }
						onDelete={ onDeleteNode }
						onSetStartNode={ onSetStartNode }
						onEdgeReorder={ onEdgeReorder }
						onEdgeDelete={ onEdgeDelete }
						onStartEdgeFrom={ onStartEdgeFrom }
						onEditEdge={ onEditEdge }
                    />
                </div>
            </div>
        </div>
    )
}