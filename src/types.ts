// ── Primitive unions ──────────────────────────────────────────────────────────

export type PostStatus   = 'publish' | 'draft' | 'private';
export type IconType     = 'round' | 'square' | 'icon' | 'thumbnail' | 'diamond';
export type IconBgShape  = 'none' | 'round' | 'square';
export type LineStyle    = 'solid' | 'dashed' | 'dotted';
export type MarkerType   = 'ring' | 'icon';
export type NodeMarkerType = 'inherit' | 'ring' | 'icon';
export type CanvasMode   = 'select' | 'add' | 'connect';
export type SaveStatusKind = '' | 'ok' | 'error';
export type StoryTab     = 'settings' | 'canvas' | 'nodes' | 'paths' | 'links';
export type LinkType     = 'map_object' | 'map_area' | 'hierarchy';

// ── Window globals ────────────────────────────────────────────────────────────

export interface CnsStoryEditorGlobal {
	storyId:         number;
	isNew:           boolean;
	status:          PostStatus;
	title:           string;
	overviewUrl:     string;
	viewUrl:         string;
	substoryBaseUrl: string;
}

export interface CnsStorySuiteGlobal {
	nonce:       string;
	restUrl:     string;
	mapRestUrl:  string;
	wpRestUrl:   string;
	overviewUrl: string;
	editorUrl:   string;
}

declare global {
	interface Window {
		cnsStoryEditor: CnsStoryEditorGlobal;
		cnsStorySuite:  CnsStorySuiteGlobal;
		cnsMapEditorExtensions?: { hasStorySuite?: boolean; storySuiteOverviewUrl?: string };
		wp?: {
			media?: ( options: object ) => {
				on:    ( event: string, cb: () => void ) => void;
				open:  () => void;
				state: () => { get: ( k: string ) => { first: () => { toJSON: () => { id: number; url: string } } } };
			};
		};
	}
}

// ── Domain: StoryPath ─────────────────────────────────────────────────────────

export interface StoryPath {
	id:                number;
	storyId:           number;
	label:             string;
	sortOrder:         number;
	markerColor:       string;
	markerSize:        number;
	markerType:        MarkerType;
	markerIconId:      number | null;
	markerIconUrl:     string;
	markerIconOffsetX: number;
	markerIconOffsetY: number;
}

export interface PathFormData {
	label:             string;
	markerColor:       string;
	markerSize:        number;
	markerType:        MarkerType;
	markerIconId:      number | null;
	markerIconUrl:     string;
	markerIconOffsetX: number;
	markerIconOffsetY: number;
}

// ── Domain: StoryNode ─────────────────────────────────────────────────────────

export interface StoryNode {
	id:                   number;
	storyId:              number;
	pathId:               number | null;
	substoryId:           number | null;
	titleOverride:        string | null;
	excerptOverride:      string | null;
	x:                    number; // 0–1 normalised
	y:                    number;
	iconType:             IconType;
	iconId:               number | null;
	iconUrl:              string | null;
	iconColor:            string;
	iconSize:             number;
	iconBorderColor:      string;
	iconBorderWidth:      number;
	iconBgColor:          string;
	iconBgShape:          IconBgShape;
	markerType:           NodeMarkerType;
	markerIconId:         number | null;
	markerIconUrl:        string | null;
	markerColor:          string | null; // null = inherit from path/global
	markerSize:           number | null; // null = inherit
	markerIconOffsetX:    number | null; // null = inherit
	markerIconOffsetY:    number | null; // null = inherit
	createdAt:            string;
	substoryTitle:        string | null;
	substoryExcerpt:      string | null;
	substoryThumbnailUrl: string | null;
	substoryUrl:          string | null;
	substoryEditUrl:      string | null;
}

// ── Domain: StoryEdge ─────────────────────────────────────────────────────────

export interface StoryEdge {
	id:         number;
	storyId:    number;
	fromNodeId: number;
	toNodeId:   number;
	sortOrder:  number;
	lineColor:   string | null;
	lineWidth:   number | null;
	lineStyle:   LineStyle | null;
	lineOpacity: number | null;
}

// ── Domain: StoryLink ─────────────────────────────────────────────────────────

export interface StoryLink {
	id:        number;
	storyId:   number;
	linkType:  LinkType;
	linkId:    number;
	linkTitle: string;
}

// ── Domain: StorySettings ─────────────────────────────────────────────────────

export interface StorySettings {
	title:           string;
	status:          PostStatus;
	mapId:           number | null;
	mapTitle:        string;
	lineColor:       string;
	lineWidth:       number;
	lineStyle:       LineStyle;
	lineOpacity:     number;
	startNodeId:     number | null;
	viewUrl:         string;
	thumbnailId:     number | null;
	thumbnailUrl:    string;
	description:     string;
	markerColor:       string;
	markerSize:        number;
	markerType:        MarkerType;
	markerIconId:      number | null;
	markerIconUrl:     string;
	markerIconOffsetX: number;
	markerIconOffsetY: number;
}

// ── Domain: Map render data (from API) ────────────────────────────────────────

export interface MapObjectRef {
	id:           number;
	x:            number; // canvas pixel coordinate
	y:            number;
	title:        string;
	iconUrl:      string;
	iconMime:     string;
	canvasStyles: { size?: number; fillStyle?: string; strokeStyle?: string } | null;
}

export interface MapAreaRef {
	id:           number;
	title:        string;
	shapeType:    'POLYGON' | 'BEZIER' | 'CIRCLE' | 'RECTANGLE';
	nodes:        Array<{ x: number; y: number }>;
	canvasStyles: { fill?: string; fillOpacity?: number; stroke?: string; strokeWidth?: number } | null;
}

export interface MapRenderData {
	id:          number;
	title:       string;
	width:       number;
	aspectRatio: number;
	bgType:      'color' | 'image';
	bgColor:     string;
	bgImageUrl:  string;
	imageUrl:    string;
	imageX:      number;
	imageY:      number;
	imageW:      number;
	objects:     MapObjectRef[];
	areas:       MapAreaRef[];
}

// ── Domain: Substory search result ────────────────────────────────────────────

export interface SubstorySearchResult {
	id:           number;
	title:        string;
	excerpt:      string;
	status:       PostStatus;
	thumbnailUrl: string;
	editUrl:      string;
}

export interface MapSearchResult {
	id:           number;
	title:        string;
	thumbnailUrl: string;
}

// ── Editor state ──────────────────────────────────────────────────────────────

export interface SaveStatus {
	text: string;
	type: SaveStatusKind;
}

// ── Form payloads ─────────────────────────────────────────────────────────────

export interface NodeFormData {
	x:                  number; // 0–1 normalised
	y:                  number;
	pathId:             number | null;
	substoryId:         number | null;
	substoryLabel:      string;
	titleOverride:      string;
	excerptOverride:    string;
	iconType:           IconType;
	iconId:             number | null;
	iconColor:          string;
	iconSize:           number;
	iconBorderColor:    string;
	iconBorderWidth:    number;
	iconBgColor:        string;
	iconBgShape:        IconBgShape;
	markerType:         NodeMarkerType;
	markerIconId:       number | null;
	markerColor:        string | null;
	markerSize:         number | null;
	markerIconOffsetX:  number | null;
	markerIconOffsetY:  number | null;
}

export interface EdgeFormData {
	lineColor:   string | null;
	lineWidth:   number | null;
	lineStyle:   LineStyle | null;
	lineOpacity: number | null;
}
