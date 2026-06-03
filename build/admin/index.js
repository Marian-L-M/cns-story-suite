/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/admin/app/CanvasNodeList.tsx"
/*!******************************************!*\
  !*** ./src/admin/app/CanvasNodeList.tsx ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ CanvasNodeList)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);

function formatStep(num) {
  return num === null ? '—' : num.join('.');
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
function buildTree(nodes, edges, startNodeId) {
  const result = [];
  const visited = new Set();
  const stepNums = new Map();
  const fromBranchOf = new Map();
  const startId = startNodeId ?? nodes[0]?.id ?? null;

  // Reachable set from a given node (DFS).
  function computeReachable(fromId) {
    const r = new Set();
    function dfs(id) {
      if (r.has(id)) return;
      r.add(id);
      for (const e of edges) {
        if (e.fromNodeId === id) dfs(e.toNodeId);
      }
    }
    dfs(fromId);
    return r;
  }

  // In-degree map (for finding component roots).
  const inDegree = new Map();
  for (const n of nodes) inDegree.set(n.id, 0);
  for (const e of edges) inDegree.set(e.toNodeId, (inDegree.get(e.toNodeId) ?? 0) + 1);

  // Component roots: startId first, then any other in-degree-0 nodes (in node order = creation ASC).
  const roots = [];
  if (startId !== null) roots.push(startId);
  for (const n of nodes) {
    if (n.id !== startId && inDegree.get(n.id) === 0) roots.push(n.id);
  }

  // Global top-level section counter; increments as component roots are processed.
  let nextSection = 1;
  for (const rootId of roots) {
    const reachable = computeReachable(rootId);
    function assignChildNumbers(nodeId, parentNum, fromBranch, isRoot) {
      const out = edges.filter(e => e.fromNodeId === nodeId && reachable.has(e.toNodeId)).sort((a, b) => a.sortOrder - b.sortOrder);
      if (isRoot) {
        const used = Math.max(1, out.length);
        out.forEach((edge, i) => {
          if (!stepNums.has(edge.toNodeId)) {
            stepNums.set(edge.toNodeId, [nextSection + i, 1]);
            fromBranchOf.set(edge.toNodeId, false);
          }
        });
        nextSection += used;
      } else if (parentNum !== null) {
        if (out.length === 1) {
          const childId = out[0].toNodeId;
          if (!stepNums.has(childId)) {
            const childNum = fromBranch ? [...parentNum, 1] : [...parentNum.slice(0, -1), parentNum[parentNum.length - 1] + 1];
            stepNums.set(childId, childNum);
            fromBranchOf.set(childId, false);
          }
        } else if (out.length > 1) {
          out.forEach((edge, i) => {
            if (!stepNums.has(edge.toNodeId)) {
              stepNums.set(edge.toNodeId, [...parentNum, i + 1]);
              fromBranchOf.set(edge.toNodeId, true);
            }
          });
        }
      }
    }
    function visit(nodeId, incomingEdge, siblings, depth, isRoot) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      const stepNumber = isRoot ? null : stepNums.get(nodeId) ?? null;
      result.push({
        node,
        incomingEdge,
        siblings,
        depth,
        stepNumber
      });
      const outEdges = edges.filter(e => e.fromNodeId === nodeId && reachable.has(e.toNodeId)).sort((a, b) => a.sortOrder - b.sortOrder);
      assignChildNumbers(nodeId, stepNumber, fromBranchOf.get(nodeId) ?? false, isRoot);
      for (const edge of outEdges) {
        visit(edge.toNodeId, edge, outEdges, depth + 1, false);
      }
    }
    visit(rootId, null, [], 0, true);
  }

  // Nodes not reached from any root (cycles / unreachable) — show without numbers.
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      result.push({
        node,
        incomingEdge: null,
        siblings: [],
        depth: 0,
        stepNumber: null
      });
      visited.add(node.id);
    }
  }
  return result;
}
function getDisplayTitle(node) {
  return node.titleOverride || node.substoryTitle || `Node #${node.id}`;
}
function CanvasNodeList({
  nodes,
  edges,
  startNodeId,
  selectedNodeId,
  onSelect,
  onEdit,
  onDelete,
  onSetStartNode,
  onEdgeReorder,
  onEdgeDelete,
  onStartEdgeFrom,
  onEditEdge
}) {
  if (!nodes.length) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
      className: "cns-canvas-node-list cns-canvas-node-list--empty",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
        className: "description",
        children: "Click on the canvas to add your first node."
      })
    });
  }
  const tree = buildTree(nodes, edges, startNodeId);
  function handleMoveUp(item) {
    const {
      incomingEdge,
      siblings
    } = item;
    if (!incomingEdge) return;
    const sorted = [...siblings].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(e => e.id === incomingEdge.id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1];
    onEdgeReorder(incomingEdge.id, prev.sortOrder);
    onEdgeReorder(prev.id, incomingEdge.sortOrder);
  }
  function handleMoveDown(item) {
    const {
      incomingEdge,
      siblings
    } = item;
    if (!incomingEdge) return;
    const sorted = [...siblings].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(e => e.id === incomingEdge.id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const next = sorted[idx + 1];
    onEdgeReorder(incomingEdge.id, next.sortOrder);
    onEdgeReorder(next.id, incomingEdge.sortOrder);
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
    className: "cns-canvas-node-list",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
      className: "cns-canvas-node-list__header",
      children: "Nodes"
    }), tree.map(item => {
      const {
        node,
        incomingEdge,
        siblings,
        depth,
        stepNumber
      } = item;
      const isStart = node.id === startNodeId;
      const isSelected = node.id === selectedNodeId;
      const isOrphan = stepNumber === null && !isStart;
      const sorted = [...siblings].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = sorted.findIndex(e => e.id === incomingEdge?.id);
      const canUp = incomingEdge !== null && idx > 0;
      const canDown = incomingEdge !== null && idx < sorted.length - 1;
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: ['cns-canvas-node-list__item', isSelected ? 'is-selected' : '', isOrphan ? 'is-orphan' : ''].filter(Boolean).join(' '),
        style: {
          paddingLeft: 8 + Math.min(depth, 4) * 14
        },
        children: [incomingEdge && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
          className: "cns-canvas-node-list__connector",
          children: "\u2514"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
          className: "cns-canvas-node-list__step",
          children: isStart ? '★' : formatStep(stepNumber)
        }), node.iconType === 'thumbnail' && node.substoryThumbnailUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", {
          src: node.substoryThumbnailUrl,
          alt: "",
          className: "cns-node-swatch",
          style: {
            borderRadius: '50%',
            objectFit: 'cover'
          }
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
          className: "cns-node-swatch",
          style: {
            background: node.iconColor,
            borderRadius: node.iconType === 'square' ? 2 : node.iconType === 'diamond' ? 0 : '50%',
            transform: node.iconType === 'diamond' ? 'rotate(45deg)' : undefined
          }
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
          className: "cns-canvas-node-list__title",
          onClick: () => onSelect(node.id),
          title: "Select on canvas",
          children: getDisplayTitle(node)
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
          className: "cns-canvas-node-list__actions",
          children: [incomingEdge && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
              className: "cns-icon-btn",
              title: "Move up in sequence",
              disabled: !canUp,
              onClick: () => handleMoveUp(item),
              children: "\u2191"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
              className: "cns-icon-btn",
              title: "Move down in sequence",
              disabled: !canDown,
              onClick: () => handleMoveDown(item),
              children: "\u2193"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
              className: "cns-icon-btn",
              title: "Style this connection",
              onClick: () => onEditEdge(incomingEdge.id),
              children: "\u2261"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
              className: "cns-icon-btn",
              title: "Remove this branch",
              onClick: () => {
                if (window.confirm('Remove the connection to this node?')) {
                  onEdgeDelete(incomingEdge.id);
                }
              },
              children: "\u2190"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
              className: "cns-icon-btn",
              title: "Split route: add a parallel branch from the same parent",
              onClick: () => onStartEdgeFrom(incomingEdge.fromNodeId),
              children: "\u2192"
            })]
          }), !incomingEdge && !isStart && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
            className: "cns-icon-btn",
            title: "Set as start node",
            onClick: () => onSetStartNode(node.id),
            children: "\u2605"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
            className: "cns-icon-btn",
            title: "Edit node",
            onClick: () => onEdit(node.id),
            children: "\u270E"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
            className: "cns-icon-btn cns-icon-btn--danger",
            title: "Delete node",
            onClick: () => {
              if (window.confirm('Delete this node and all its connections?')) {
                onDelete(node.id);
              }
            },
            children: "\u2715"
          })]
        })]
      }, node.id);
    })]
  });
}

/***/ },

/***/ "./src/admin/app/EditorHeader.tsx"
/*!****************************************!*\
  !*** ./src/admin/app/EditorHeader.tsx ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ EditorHeader)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);

const STATUS_LABELS = {
  draft: 'Draft',
  publish: 'Published',
  private: 'Private'
};
function EditorHeader({
  pageTitle,
  overviewUrl,
  viewUrl,
  status,
  saveStatus,
  onStatusChange,
  onSave
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
    className: "cns-map-editor__header",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
      href: overviewUrl,
      className: "cns-back-link",
      children: "\u2190 All Stories"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h1", {
      children: pageTitle
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
      className: "cns-map-editor__header-actions",
      children: [saveStatus.text && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
        className: `cns-save-status${saveStatus.type ? ` cns-save-status--${saveStatus.type}` : ''}`,
        children: saveStatus.text
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("select", {
        value: status,
        onChange: e => onStatusChange(e.target.value),
        className: "cns-status-select",
        "aria-label": "Post status",
        children: Object.keys(STATUS_LABELS).map(s => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("option", {
          value: s,
          children: STATUS_LABELS[s]
        }, s))
      }), viewUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
        href: viewUrl,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "button",
        children: "View Story"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
        onClick: onSave,
        className: "button button-primary",
        children: "Save Story"
      })]
    })]
  });
}

/***/ },

/***/ "./src/admin/app/StoryEditorApp.tsx"
/*!******************************************!*\
  !*** ./src/admin/app/StoryEditorApp.tsx ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ StoryEditorApp)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _EditorHeader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./EditorHeader */ "./src/admin/app/EditorHeader.tsx");
/* harmony import */ var _TabBar__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./TabBar */ "./src/admin/app/TabBar.tsx");
/* harmony import */ var _canvas_StoryCanvas__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../canvas/StoryCanvas */ "./src/admin/canvas/StoryCanvas.tsx");
/* harmony import */ var _CanvasNodeList__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./CanvasNodeList */ "./src/admin/app/CanvasNodeList.tsx");
/* harmony import */ var _panels_SettingsPanel__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./panels/SettingsPanel */ "./src/admin/app/panels/SettingsPanel.tsx");
/* harmony import */ var _panels_NodesPanel__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./panels/NodesPanel */ "./src/admin/app/panels/NodesPanel.tsx");
/* harmony import */ var _panels_PathsPanel__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./panels/PathsPanel */ "./src/admin/app/panels/PathsPanel.tsx");
/* harmony import */ var _panels_LinksPanel__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./panels/LinksPanel */ "./src/admin/app/panels/LinksPanel.tsx");
/* harmony import */ var _forms_NodeModal__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./forms/NodeModal */ "./src/admin/app/forms/NodeModal.tsx");
/* harmony import */ var _forms_EdgeStyleModal__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./forms/EdgeStyleModal */ "./src/admin/app/forms/EdgeStyleModal.tsx");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../utils */ "./src/admin/utils.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__);













function buildInitialSettings() {
  const d = window.cnsStoryEditor || {};
  return {
    title: d.title ?? '',
    status: d.status ?? 'draft',
    mapId: null,
    mapTitle: '',
    lineColor: '#ffffff',
    lineWidth: 3,
    lineStyle: 'solid',
    lineOpacity: 1.0,
    startNodeId: null,
    viewUrl: d.viewUrl ?? '',
    thumbnailId: null,
    thumbnailUrl: '',
    description: '',
    markerColor: '#00aaff',
    markerSize: 5,
    markerType: 'ring',
    markerIconId: null,
    markerIconUrl: '',
    markerIconOffsetX: 0,
    markerIconOffsetY: -30
  };
}
function StoryEditorApp() {
  const d = window.cnsStoryEditor || {};
  const storyId = d.storyId || 0;
  const isNew = d.isNew || false;
  const [settings, setSettings] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(buildInitialSettings);
  const [nodes, setNodes] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [edges, setEdges] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [paths, setPaths] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [links, setLinks] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [mapData, setMapData] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [mapObjects, setMapObjects] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [mapAreas, setMapAreas] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [activeTab, setActiveTab] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('settings');
  const [selectedNodeId, setSelectedNodeId] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [canvasMode, setCanvasMode] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('select');
  const [edgeStartNodeId, setEdgeStartNodeId] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [saveStatus, setSaveStatus] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({
    text: '',
    type: ''
  });
  const [nodeModal, setNodeModal] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({
    open: false,
    nodeId: null,
    x: 0.5,
    y: 0.5
  });
  const [edgeModal, setEdgeModal] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({
    open: false,
    edgeId: null
  });
  const [loading, setLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(!isNew);

  // ── Initial data load ─────────────────────────────────────────────────────

  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (isNew) return;
    (async () => {
      const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('GET', `/stories/${storyId}/data`);
      const data = await res.json();
      if (res.ok) {
        setSettings(data.story);
        setNodes(data.nodes);
        setEdges(data.edges);
        setPaths(data.paths ?? []);
        if (data.mapData) {
          setMapData(data.mapData);
          setMapObjects(data.mapData.objects);
          setMapAreas(data.mapData.areas);
        }
      }
      const linksRes = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('GET', `/stories/${storyId}/links`);
      if (linksRes.ok) setLinks(await linksRes.json());
      setLoading(false);
    })();
  }, []);

  // ── Save story settings ───────────────────────────────────────────────────

  async function handleSave() {
    setSaveStatus({
      text: 'Saving…',
      type: ''
    });
    try {
      const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('POST', '/stories', {
        story_id: storyId,
        title: settings.title,
        description: settings.description,
        status: settings.status,
        map_id: settings.mapId ?? 0,
        line_color: settings.lineColor,
        line_width: settings.lineWidth,
        line_style: settings.lineStyle,
        line_opacity: settings.lineOpacity,
        start_node_id: settings.startNodeId ?? 0,
        thumbnail_id: settings.thumbnailId ?? 0,
        marker_color: settings.markerColor,
        marker_size: settings.markerSize,
        marker_type: settings.markerType,
        marker_icon_id: settings.markerIconId ?? 0,
        marker_icon_offset_x: settings.markerIconOffsetX,
        marker_icon_offset_y: settings.markerIconOffsetY
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed.');
      if (data.created && data.editUrl) {
        window.location.href = data.editUrl;
      } else {
        if (data.viewUrl !== undefined) {
          setSettings(p => ({
            ...p,
            viewUrl: data.viewUrl
          }));
        }
        setSaveStatus({
          text: 'Saved.',
          type: 'ok'
        });
        setTimeout(() => setSaveStatus({
          text: '',
          type: ''
        }), 2000);
      }
    } catch (err) {
      setSaveStatus({
        text: err.message,
        type: 'error'
      });
    }
  }

  // ── Map data reload when mapId changes ────────────────────────────────────

  async function handleMapChange(mapId, mapTitle) {
    setSettings(p => ({
      ...p,
      mapId,
      mapTitle
    }));
    if (!mapId) {
      setMapData(null);
      setMapObjects([]);
      setMapAreas([]);
      return;
    }
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('GET', `/maps/${mapId}/stories`);
    // Reload full story data to get map render data.
    if (!isNew && storyId) {
      const dataRes = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('GET', `/stories/${storyId}/data`);
      if (dataRes.ok) {
        const data = await dataRes.json();
        if (data.mapData) {
          setMapData(data.mapData);
          setMapObjects(data.mapData.objects);
          setMapAreas(data.mapData.areas);
        }
      }
    }
    void res;
  }

  // ── Node operations ───────────────────────────────────────────────────────

  async function handleNodeCreate(formData, x, y) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('POST', `/stories/${storyId}/nodes`, {
      x,
      y,
      path_id: formData.pathId ?? 0,
      substory_id: formData.substoryId ?? 0,
      title_override: formData.titleOverride || null,
      excerpt_override: formData.excerptOverride || null,
      icon_type: formData.iconType,
      icon_id: formData.iconId ?? 0,
      icon_color: formData.iconColor,
      icon_size: formData.iconSize,
      icon_border_color: formData.iconBorderColor,
      icon_border_width: formData.iconBorderWidth,
      icon_bg_color: formData.iconBgColor,
      icon_bg_shape: formData.iconBgShape,
      marker_type: formData.markerType,
      marker_icon_id: formData.markerIconId ?? 0,
      marker_color: formData.markerColor,
      marker_size: formData.markerSize,
      marker_icon_offset_x: formData.markerIconOffsetX,
      marker_icon_offset_y: formData.markerIconOffsetY
    });
    if (res.ok) {
      const node = await res.json();
      setNodes(p => [...p, node]);
      return node;
    }
  }
  async function handleNodeUpdate(nodeId, formData) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('PATCH', `/nodes/${nodeId}`, {
      x: formData.x,
      y: formData.y,
      path_id: formData.pathId ?? 0,
      substory_id: formData.substoryId ?? 0,
      title_override: formData.titleOverride || null,
      excerpt_override: formData.excerptOverride || null,
      icon_type: formData.iconType,
      icon_id: formData.iconId ?? 0,
      icon_color: formData.iconColor,
      icon_size: formData.iconSize,
      icon_border_color: formData.iconBorderColor,
      icon_border_width: formData.iconBorderWidth,
      icon_bg_color: formData.iconBgColor,
      icon_bg_shape: formData.iconBgShape,
      marker_type: formData.markerType,
      marker_icon_id: formData.markerIconId ?? 0,
      marker_color: formData.markerColor,
      marker_size: formData.markerSize,
      marker_icon_offset_x: formData.markerIconOffsetX,
      marker_icon_offset_y: formData.markerIconOffsetY
    });
    if (res.ok) {
      const updated = await res.json();
      setNodes(p => p.map(n => n.id === nodeId ? updated : n));
    }
  }
  async function handleNodeDelete(nodeId) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('DELETE', `/nodes/${nodeId}`);
    if (res.ok) {
      setNodes(p => p.filter(n => n.id !== nodeId));
      setEdges(p => p.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    }
  }
  async function handleNodeDragEnd(nodeId, x, y) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('PATCH', `/nodes/${nodeId}`, {
      x,
      y
    });
    if (res.ok) {
      const updated = await res.json();
      setNodes(p => p.map(n => n.id === nodeId ? updated : n));
    }
  }

  // ── Edge operations ───────────────────────────────────────────────────────

  async function handleEdgeCreate(fromId, toId) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('POST', '/edges', {
      story_id: storyId,
      from_node_id: fromId,
      to_node_id: toId
    });
    if (res.ok) {
      const edge = await res.json();
      setEdges(p => {
        // Replace if duplicate returned (status 200).
        const filtered = p.filter(e => e.id !== edge.id);
        return [...filtered, edge];
      });
    }
  }
  async function handleEdgeDelete(edgeId) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('DELETE', `/edges/${edgeId}`);
    if (res.ok) {
      setEdges(p => p.filter(e => e.id !== edgeId));
    }
  }
  async function handleEdgeUpdate(edgeId, formData) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('PATCH', `/edges/${edgeId}`, {
      line_color: formData.lineColor,
      line_width: formData.lineWidth,
      line_style: formData.lineStyle,
      line_opacity: formData.lineOpacity
    });
    if (res.ok) {
      const updated = await res.json();
      setEdges(p => p.map(e => e.id === edgeId ? updated : e));
    }
  }

  // ── Path operations ───────────────────────────────────────────────────────

  async function handlePathCreate(data) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('POST', `/stories/${storyId}/paths`, {
      label: data.label,
      marker_color: data.markerColor,
      marker_size: data.markerSize,
      marker_type: data.markerType,
      marker_icon_id: data.markerIconId ?? 0,
      marker_icon_offset_x: data.markerIconOffsetX,
      marker_icon_offset_y: data.markerIconOffsetY
    });
    if (res.ok) {
      const path = await res.json();
      setPaths(p => [...p, path]);
    }
  }
  async function handlePathUpdate(pathId, data) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('PATCH', `/paths/${pathId}`, {
      label: data.label,
      marker_color: data.markerColor,
      marker_size: data.markerSize,
      marker_type: data.markerType,
      marker_icon_id: data.markerIconId ?? 0,
      marker_icon_offset_x: data.markerIconOffsetX,
      marker_icon_offset_y: data.markerIconOffsetY
    });
    if (res.ok) {
      const updated = await res.json();
      setPaths(p => p.map(path => path.id === pathId ? updated : path));
    }
  }
  async function handlePathDelete(pathId) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('DELETE', `/paths/${pathId}`);
    if (res.ok) {
      setPaths(p => p.filter(path => path.id !== pathId));
      // Clear pathId on nodes that belonged to this path.
      setNodes(ns => ns.map(n => n.pathId === pathId ? {
        ...n,
        pathId: null
      } : n));
    }
  }

  // ── Link operations ───────────────────────────────────────────────────────

  async function handleLinkAdd(linkType, linkId) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('POST', `/stories/${storyId}/links`, {
      link_type: linkType,
      link_id: linkId
    });
    if (res.ok) {
      const link = await res.json();
      setLinks(p => {
        const filtered = p.filter(l => l.id !== link.id);
        return [...filtered, link];
      });
    }
  }
  async function handleLinkDelete(linkId) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('DELETE', `/links/${linkId}`);
    if (res.ok) setLinks(p => p.filter(l => l.id !== linkId));
  }

  // ── Edge reorder ─────────────────────────────────────────────────────────

  async function handleEdgeReorder(edgeId, sortOrder) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_11__.apiFetch)('PATCH', `/edges/${edgeId}`, {
      sort_order: sortOrder
    });
    if (res.ok) {
      const updated = await res.json();
      setEdges(p => p.map(e => e.id === edgeId ? updated : e));
    }
  }

  // ── Canvas mode key handler ───────────────────────────────────────────────

  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (canvasMode !== 'connect') return;
    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        setCanvasMode('select');
        setEdgeStartNodeId(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [canvasMode]);

  // ── Canvas interaction ────────────────────────────────────────────────────

  function enterConnectMode() {
    setEdgeStartNodeId(selectedNodeId);
    setCanvasMode('connect');
  }
  function exitConnectMode() {
    setCanvasMode('select');
    setEdgeStartNodeId(null);
  }
  function handleNodeClick(nodeId) {
    if (canvasMode === 'connect') {
      if (edgeStartNodeId === null || edgeStartNodeId === nodeId) {
        exitConnectMode();
      } else {
        handleEdgeCreate(edgeStartNodeId, nodeId);
        setEdgeStartNodeId(nodeId);
        setSelectedNodeId(nodeId);
      }
    } else {
      setSelectedNodeId(nodeId);
    }
  }
  function handleCanvasClick(x, y) {
    if (canvasMode === 'connect') {
      exitConnectMode();
      return;
    }
    if (isNew) {
      setSaveStatus({
        text: 'Save the story first before adding nodes.',
        type: 'error'
      });
      setTimeout(() => setSaveStatus({
        text: '',
        type: ''
      }), 3000);
      return;
    }
    if (canvasMode === 'select' && selectedNodeId !== null) {
      handleNodeDragEnd(selectedNodeId, x, y);
      setSelectedNodeId(null);
      return;
    }
    if (canvasMode === 'add') {
      setNodeModal({
        open: true,
        nodeId: null,
        x,
        y
      });
    }
  }
  function handleEdgeClick(edgeId) {
    setEdgeModal({
      open: true,
      edgeId
    });
  }
  function handleStartEdgeFrom(fromNodeId) {
    setSelectedNodeId(fromNodeId);
    setEdgeStartNodeId(fromNodeId);
    setCanvasMode('connect');
  }

  // ── Modal save ────────────────────────────────────────────────────────────

  async function handleModalSave(formData) {
    if (nodeModal.nodeId === null) {
      await handleNodeCreate(formData, formData.x, formData.y);
    } else {
      await handleNodeUpdate(nodeModal.nodeId, formData);
    }
    setNodeModal({
      open: false,
      nodeId: null,
      x: 0,
      y: 0
    });
    setSelectedNodeId(null);
  }

  // ── Tab change ────────────────────────────────────────────────────────────

  function handleTabChange(tab) {
    if (tab !== 'canvas') {
      exitConnectMode();
      setSelectedNodeId(null);
    }
    setActiveTab(tab);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const pageTitle = isNew ? 'New Story' : `Edit: ${settings.title || '(no title)'}`;
  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
      className: "cns-story-editor",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
        className: "cns-loading",
        children: "Loading\u2026"
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
    className: "cns-story-editor cns-map-editor",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_EditorHeader__WEBPACK_IMPORTED_MODULE_1__["default"], {
      pageTitle: pageTitle,
      overviewUrl: d.overviewUrl || '#',
      viewUrl: !isNew ? settings.viewUrl : '',
      status: settings.status,
      saveStatus: saveStatus,
      onStatusChange: s => setSettings(p => ({
        ...p,
        status: s
      })),
      onSave: handleSave
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
      className: "cns-editor-main",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
        className: "cns-map-editor__body",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_TabBar__WEBPACK_IMPORTED_MODULE_2__["default"], {
          activeTab: activeTab,
          onChange: handleTabChange
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
          className: "cns-map-editor__content",
          children: [activeTab === 'settings' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_panels_SettingsPanel__WEBPACK_IMPORTED_MODULE_5__["default"], {
            settings: settings,
            onChange: setSettings,
            onMapChange: handleMapChange
          }), activeTab === 'canvas' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
            className: "cns-story-canvas-view",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
              className: "cns-story-canvas-toolbar",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
                className: "cns-story-canvas-toolbar__row",
                children: [!isNew && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
                  className: "cns-mode-buttons",
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("button", {
                    className: `button button-small${canvasMode === 'select' ? ' button-primary' : ''}`,
                    onClick: () => {
                      setCanvasMode('select');
                      setEdgeStartNodeId(null);
                    },
                    title: "Select / reposition nodes",
                    children: "\u2196 Select"
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("button", {
                    className: `button button-small${canvasMode === 'add' ? ' button-primary' : ''}`,
                    onClick: () => {
                      setCanvasMode('add');
                      setEdgeStartNodeId(null);
                    },
                    title: "Click canvas to add a new node",
                    children: "+ Add"
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("button", {
                    className: `button button-small${canvasMode === 'connect' ? ' button-primary' : ''}`,
                    onClick: () => {
                      if (canvasMode === 'connect') {
                        exitConnectMode();
                      } else {
                        setEdgeStartNodeId(selectedNodeId);
                        setCanvasMode('connect');
                      }
                    },
                    title: "Chain-link nodes to create a path",
                    children: "\u27F6 Connect"
                  })]
                }), canvasMode === 'connect' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
                  className: "cns-story-canvas-toolbar__hint",
                  children: edgeStartNodeId === null ? 'Click a node to start a path' : 'Click next node · Enter or Esc to finish'
                }), canvasMode === 'select' && selectedNodeId !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
                  className: "cns-story-canvas-toolbar__hint",
                  children: "Click canvas to move here"
                }), canvasMode === 'add' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
                  className: "cns-story-canvas-toolbar__hint",
                  children: "Click canvas to place a new node"
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
                className: "cns-story-canvas-toolbar__row cns-story-canvas-toolbar__line-style",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
                  className: "cns-story-canvas-toolbar__label",
                  children: "Lines:"
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("label", {
                  children: ["Color", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("input", {
                    type: "color",
                    value: settings.lineColor,
                    onChange: e => setSettings(p => ({
                      ...p,
                      lineColor: e.target.value
                    }))
                  })]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("label", {
                  children: ["Width", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("input", {
                    type: "number",
                    min: "0.5",
                    max: "20",
                    step: "0.5",
                    value: settings.lineWidth,
                    onChange: e => setSettings(p => ({
                      ...p,
                      lineWidth: parseFloat(e.target.value)
                    })),
                    style: {
                      width: 48
                    }
                  }), "px"]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("label", {
                  children: ["Style", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("select", {
                    value: settings.lineStyle,
                    onChange: e => setSettings(p => ({
                      ...p,
                      lineStyle: e.target.value
                    })),
                    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("option", {
                      value: "solid",
                      children: "Solid"
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("option", {
                      value: "dashed",
                      children: "Dashed"
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("option", {
                      value: "dotted",
                      children: "Dotted"
                    })]
                  })]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("label", {
                  children: ["Opacity", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "1",
                    step: "0.05",
                    value: settings.lineOpacity,
                    onChange: e => setSettings(p => ({
                      ...p,
                      lineOpacity: parseFloat(e.target.value)
                    })),
                    style: {
                      width: 80
                    }
                  }), Math.round(settings.lineOpacity * 100), "%"]
                })]
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
              className: "cns-story-canvas-layout",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
                className: "cns-story-canvas-main",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
                  className: "cns-story-canvas-wrap",
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_canvas_StoryCanvas__WEBPACK_IMPORTED_MODULE_3__["default"], {
                    mapData: mapData,
                    mapObjects: mapObjects,
                    mapAreas: mapAreas,
                    nodes: nodes,
                    edges: edges,
                    paths: paths,
                    selectedNodeId: selectedNodeId,
                    edgeStartNodeId: edgeStartNodeId,
                    isEdgeMode: canvasMode === 'connect',
                    lineColor: settings.lineColor,
                    lineWidth: settings.lineWidth,
                    lineStyle: settings.lineStyle,
                    lineOpacity: settings.lineOpacity,
                    markerColor: settings.markerColor,
                    markerSize: settings.markerSize,
                    markerType: settings.markerType,
                    markerIconUrl: settings.markerIconUrl,
                    markerIconOffsetX: settings.markerIconOffsetX,
                    markerIconOffsetY: settings.markerIconOffsetY,
                    onNodeClick: handleNodeClick,
                    onCanvasClick: handleCanvasClick,
                    onEdgeClick: handleEdgeClick,
                    onNodeDragEnd: handleNodeDragEnd
                  })
                })
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
                className: "cns-story-window-panel",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_CanvasNodeList__WEBPACK_IMPORTED_MODULE_4__["default"], {
                  nodes: nodes,
                  edges: edges,
                  startNodeId: settings.startNodeId,
                  selectedNodeId: selectedNodeId,
                  onSelect: id => setSelectedNodeId(id),
                  onEdit: id => {
                    setSelectedNodeId(id);
                    setNodeModal({
                      open: true,
                      nodeId: id,
                      x: 0,
                      y: 0
                    });
                  },
                  onDelete: handleNodeDelete,
                  onSetStartNode: id => setSettings(p => ({
                    ...p,
                    startNodeId: id
                  })),
                  onEdgeReorder: handleEdgeReorder,
                  onEdgeDelete: handleEdgeDelete,
                  onStartEdgeFrom: handleStartEdgeFrom,
                  onEditEdge: edgeId => setEdgeModal({
                    open: true,
                    edgeId
                  })
                })
              })]
            })]
          }), activeTab === 'nodes' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_panels_NodesPanel__WEBPACK_IMPORTED_MODULE_6__["default"], {
            nodes: nodes,
            edges: edges,
            paths: paths,
            startNodeId: settings.startNodeId,
            onEditNode: id => {
              setSelectedNodeId(id);
              setNodeModal({
                open: true,
                nodeId: id,
                x: 0,
                y: 0
              });
            },
            onDeleteNode: handleNodeDelete,
            onSetStartNode: id => setSettings(p => ({
              ...p,
              startNodeId: id
            })),
            onEdgeReorder: handleEdgeReorder,
            onEdgeDelete: handleEdgeDelete,
            onEditEdge: id => setEdgeModal({
              open: true,
              edgeId: id
            })
          }), activeTab === 'paths' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_panels_PathsPanel__WEBPACK_IMPORTED_MODULE_7__["default"], {
            paths: paths,
            onCreatePath: handlePathCreate,
            onUpdatePath: handlePathUpdate,
            onDeletePath: handlePathDelete
          }), activeTab === 'links' && !isNew && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_panels_LinksPanel__WEBPACK_IMPORTED_MODULE_8__["default"], {
            storyId: storyId,
            links: links,
            onLinkAdd: handleLinkAdd,
            onLinkDelete: handleLinkDelete
          }), activeTab === 'links' && isNew && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
            className: "cns-panel-notice",
            children: "Save the story first to manage links."
          })]
        })]
      })
    }), nodeModal.open && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_forms_NodeModal__WEBPACK_IMPORTED_MODULE_9__["default"], {
      nodeId: nodeModal.nodeId,
      existingNode: selectedNode,
      initialX: nodeModal.x,
      initialY: nodeModal.y,
      paths: paths,
      onSave: handleModalSave,
      onClose: () => {
        setNodeModal({
          open: false,
          nodeId: null,
          x: 0,
          y: 0
        });
        setSelectedNodeId(null);
      }
    }), edgeModal.open && (() => {
      const edge = edges.find(e => e.id === edgeModal.edgeId);
      return edge ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_forms_EdgeStyleModal__WEBPACK_IMPORTED_MODULE_10__["default"], {
        edge: edge,
        storyColor: settings.lineColor,
        storyWidth: settings.lineWidth,
        storyStyle: settings.lineStyle,
        storyOpacity: settings.lineOpacity,
        onSave: handleEdgeUpdate,
        onDelete: handleEdgeDelete,
        onClose: () => setEdgeModal({
          open: false,
          edgeId: null
        })
      }) : null;
    })()]
  });
}

/***/ },

/***/ "./src/admin/app/TabBar.tsx"
/*!**********************************!*\
  !*** ./src/admin/app/TabBar.tsx ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ TabBar)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);

const TABS = [{
  id: 'settings',
  label: 'Settings'
}, {
  id: 'canvas',
  label: 'Canvas'
}, {
  id: 'nodes',
  label: 'Nodes'
}, {
  id: 'paths',
  label: 'Paths'
}, {
  id: 'links',
  label: 'Links'
}];
function TabBar({
  activeTab,
  onChange
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("nav", {
    className: "cns-map-editor__tabs",
    role: "tablist",
    "aria-label": "Story editor modes",
    children: TABS.map(t => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
      className: `cns-tab${activeTab === t.id ? ' cns-tab--active' : ''}`,
      role: "tab",
      "aria-selected": activeTab === t.id,
      onClick: () => onChange(t.id),
      children: t.label
    }, t.id))
  });
}

/***/ },

/***/ "./src/admin/app/forms/EdgeStyleModal.tsx"
/*!************************************************!*\
  !*** ./src/admin/app/forms/EdgeStyleModal.tsx ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ EdgeStyleModal)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


function EdgeStyleModal({
  edge,
  storyColor,
  storyWidth,
  storyStyle,
  storyOpacity,
  onSave,
  onDelete,
  onClose
}) {
  const [form, setForm] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({
    lineColor: edge.lineColor,
    lineWidth: edge.lineWidth,
    lineStyle: edge.lineStyle,
    lineOpacity: edge.lineOpacity
  });
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    document.body.classList.add('cns-modal-open');
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('cns-modal-open');
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  const effectiveColor = form.lineColor ?? storyColor;
  const effectiveWidth = form.lineWidth ?? storyWidth;
  const effectiveStyle = form.lineStyle ?? storyStyle;
  const effectiveOpacity = form.lineOpacity ?? storyOpacity;
  const hasOverride = form.lineColor !== null || form.lineWidth !== null || form.lineStyle !== null || form.lineOpacity !== null;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
    className: "cns-modal",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Path Style",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("div", {
      className: "cns-modal__backdrop",
      onClick: onClose
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
      className: "cns-modal__dialog",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
        className: "cns-modal__header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("h2", {
          className: "cns-modal__title",
          children: "Path Style"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
          className: "cns-modal__close",
          onClick: onClose,
          "aria-label": "Close",
          children: "\xD7"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("div", {
        className: "cns-modal__body",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
          className: "cns-modal-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("p", {
            className: "description",
            children: "Override this connection\u2019s line style, or use the story\u2019s global settings."
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
            className: "cns-form-grid",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("label", {
                children: ["Color", form.lineColor === null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("em", {
                  style: {
                    fontWeight: 'normal',
                    marginLeft: 4
                  },
                  children: "(story default)"
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
                style: {
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center'
                },
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("input", {
                  type: "color",
                  value: effectiveColor,
                  onChange: e => setForm(p => ({
                    ...p,
                    lineColor: e.target.value
                  }))
                }), form.lineColor !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
                  type: "button",
                  className: "button button-small",
                  onClick: () => setForm(p => ({
                    ...p,
                    lineColor: null
                  })),
                  children: "\u21BA"
                })]
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("label", {
                children: ["Width", form.lineWidth === null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("em", {
                  style: {
                    fontWeight: 'normal',
                    marginLeft: 4
                  },
                  children: "(story default)"
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
                style: {
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center'
                },
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("input", {
                  type: "number",
                  className: "small-text",
                  min: "0.5",
                  max: "20",
                  step: "0.5",
                  value: effectiveWidth,
                  onChange: e => setForm(p => ({
                    ...p,
                    lineWidth: parseFloat(e.target.value)
                  })),
                  style: {
                    width: 56
                  }
                }), form.lineWidth !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
                  type: "button",
                  className: "button button-small",
                  onClick: () => setForm(p => ({
                    ...p,
                    lineWidth: null
                  })),
                  children: "\u21BA"
                })]
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("label", {
                children: ["Style", form.lineStyle === null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("em", {
                  style: {
                    fontWeight: 'normal',
                    marginLeft: 4
                  },
                  children: "(story default)"
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
                style: {
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center'
                },
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("select", {
                  value: effectiveStyle,
                  onChange: e => setForm(p => ({
                    ...p,
                    lineStyle: e.target.value
                  })),
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("option", {
                    value: "solid",
                    children: "Solid"
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("option", {
                    value: "dashed",
                    children: "Dashed"
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("option", {
                    value: "dotted",
                    children: "Dotted"
                  })]
                }), form.lineStyle !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
                  type: "button",
                  className: "button button-small",
                  onClick: () => setForm(p => ({
                    ...p,
                    lineStyle: null
                  })),
                  children: "\u21BA"
                })]
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
              className: "cns-form-row cns-form-row--full",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("label", {
                children: ["Opacity", form.lineOpacity === null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("em", {
                  style: {
                    fontWeight: 'normal',
                    marginLeft: 4
                  },
                  children: "(story default)"
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
                style: {
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center'
                },
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("input", {
                  type: "range",
                  min: "0",
                  max: "1",
                  step: "0.05",
                  value: effectiveOpacity,
                  onChange: e => setForm(p => ({
                    ...p,
                    lineOpacity: parseFloat(e.target.value)
                  })),
                  style: {
                    width: 100
                  }
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("span", {
                  children: [Math.round(effectiveOpacity * 100), "%"]
                }), form.lineOpacity !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
                  type: "button",
                  className: "button button-small",
                  onClick: () => setForm(p => ({
                    ...p,
                    lineOpacity: null
                  })),
                  children: "\u21BA"
                })]
              })]
            })]
          }), hasOverride && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
            type: "button",
            className: "button",
            style: {
              marginTop: 12
            },
            onClick: () => setForm({
              lineColor: null,
              lineWidth: null,
              lineStyle: null,
              lineOpacity: null
            }),
            children: "Reset all to story defaults"
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
        className: "cns-modal__footer",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
          type: "button",
          className: "button",
          style: {
            color: '#b32d2e',
            marginRight: 'auto'
          },
          onClick: () => {
            if (window.confirm('Delete this connection?')) {
              onDelete(edge.id);
              onClose();
            }
          },
          children: "Delete connection"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
          type: "button",
          className: "button",
          onClick: onClose,
          children: "Cancel"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
          type: "button",
          className: "button button-primary",
          onClick: () => {
            onSave(edge.id, form);
            onClose();
          },
          children: "Save"
        })]
      })]
    })]
  });
}

/***/ },

/***/ "./src/admin/app/forms/NodeModal.tsx"
/*!*******************************************!*\
  !*** ./src/admin/app/forms/NodeModal.tsx ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ NodeModal)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _shared_SubstoryPicker__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/SubstoryPicker */ "./src/admin/app/shared/SubstoryPicker.tsx");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils */ "./src/admin/utils.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);




function buildInitialForm(node, initialX, initialY) {
  return {
    x: node?.x ?? initialX,
    y: node?.y ?? initialY,
    pathId: node?.pathId ?? null,
    substoryId: node?.substoryId ?? null,
    substoryLabel: node?.substoryTitle ?? '',
    titleOverride: node?.titleOverride ?? '',
    excerptOverride: node?.excerptOverride ?? '',
    iconType: node?.iconType ?? 'round',
    iconId: node?.iconId ?? null,
    iconColor: node?.iconColor ?? '#ffffff',
    iconSize: node?.iconSize ?? 1.0,
    iconBorderColor: node?.iconBorderColor ?? '#000000',
    iconBorderWidth: node?.iconBorderWidth ?? 2,
    iconBgColor: node?.iconBgColor ?? '#ffffff',
    iconBgShape: node?.iconBgShape ?? 'none',
    markerType: node?.markerType ?? 'inherit',
    markerIconId: node?.markerIconId ?? null,
    markerColor: node?.markerColor ?? null,
    markerSize: node?.markerSize ?? null,
    markerIconOffsetX: node?.markerIconOffsetX ?? null,
    markerIconOffsetY: node?.markerIconOffsetY ?? null
  };
}
function NodeModal({
  nodeId,
  existingNode,
  initialX,
  initialY,
  paths,
  onSave,
  onClose
}) {
  const [form, setForm] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => buildInitialForm(existingNode, initialX, initialY));
  const [saving, setSaving] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [newTitle, setNewTitle] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [creating, setCreating] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const isNew = nodeId === null;

  // Lock body scroll and handle Escape key.
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    document.body.classList.add('cns-modal-open');
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('cns-modal-open');
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    setForm(buildInitialForm(existingNode, initialX, initialY));
  }, [existingNode]);
  function set(key, value) {
    setForm(p => ({
      ...p,
      [key]: value
    }));
  }
  async function handleCreateSubstory() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_2__.apiFetch)('POST', '/substories', {
        title: newTitle
      });
      const data = await res.json();
      if (res.ok) {
        set('substoryId', data.id);
        set('substoryLabel', data.title);
        setNewTitle('');
      }
    } finally {
      setCreating(false);
    }
  }
  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
    className: "cns-modal",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": isNew ? 'Add Node' : 'Edit Node',
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
      className: "cns-modal__backdrop",
      onClick: onClose
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: "cns-modal__dialog",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
        className: "cns-modal__header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("h2", {
          className: "cns-modal__title",
          children: isNew ? 'Add Node' : 'Edit Node'
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
          className: "cns-modal__close",
          onClick: onClose,
          "aria-label": "Close",
          children: "\xD7"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
        className: "cns-modal__body",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "cns-modal-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("h3", {
            children: "Substory Post"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_shared_SubstoryPicker__WEBPACK_IMPORTED_MODULE_1__["default"], {
            substoryId: form.substoryId,
            substoryLabel: form.substoryLabel,
            onChange: (id, label) => {
              set('substoryId', id);
              set('substoryLabel', label);
            }
          }), !form.substoryId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
            className: "cns-modal-section__create",
            style: {
              marginTop: 10
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
              className: "description",
              style: {
                marginBottom: 6
              },
              children: "Or create a new substory post:"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              style: {
                display: 'flex',
                gap: 8,
                alignItems: 'center'
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                type: "text",
                className: "regular-text",
                placeholder: "New substory title\u2026",
                value: newTitle,
                onChange: e => setNewTitle(e.target.value),
                onKeyDown: e => {
                  if (e.key === 'Enter') handleCreateSubstory();
                },
                style: {
                  flex: 1
                }
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
                type: "button",
                className: "button",
                onClick: handleCreateSubstory,
                disabled: creating || !newTitle.trim(),
                children: creating ? 'Creating…' : 'Create'
              })]
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "cns-modal-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("h3", {
            children: "Display Overrides"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
            className: "description",
            style: {
              marginBottom: 12
            },
            children: "Leave blank to use the substory post\u2019s title and excerpt."
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
            className: "cns-form-grid",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row cns-form-row--full",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                htmlFor: "node-title-override",
                children: "Title"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                id: "node-title-override",
                type: "text",
                className: "regular-text",
                value: form.titleOverride,
                onChange: e => set('titleOverride', e.target.value),
                placeholder: form.substoryLabel || 'Node title…'
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row cns-form-row--full",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                htmlFor: "node-excerpt-override",
                children: "Excerpt"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("textarea", {
                id: "node-excerpt-override",
                className: "large-text",
                rows: 3,
                value: form.excerptOverride,
                onChange: e => set('excerptOverride', e.target.value),
                placeholder: "Short description shown in the story window\u2026"
              })]
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "cns-modal-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("h3", {
            children: "Position"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
            className: "cns-form-grid",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                htmlFor: "node-pos-x",
                children: "X (%)"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                id: "node-pos-x",
                type: "number",
                className: "small-text",
                min: "0",
                max: "100",
                step: "0.1",
                value: Math.round(form.x * 1000) / 10,
                onChange: e => set('x', Math.max(0, Math.min(1, parseFloat(e.target.value) / 100)))
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                htmlFor: "node-pos-y",
                children: "Y (%)"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                id: "node-pos-y",
                type: "number",
                className: "small-text",
                min: "0",
                max: "100",
                step: "0.1",
                value: Math.round(form.y * 1000) / 10,
                onChange: e => set('y', Math.max(0, Math.min(1, parseFloat(e.target.value) / 100)))
              })]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
            className: "description",
            style: {
              marginTop: 6
            },
            children: "Position as a percentage of canvas width/height from the top-left. Also adjustable by clicking or dragging on the canvas."
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "cns-modal-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("h3", {
            children: "Node Appearance"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
            className: "cns-form-grid",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row cns-form-row--full",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                children: "Shape"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
                className: "cns-radio-toggle",
                children: ['round', 'square', 'diamond', 'icon', 'thumbnail'].map(t => {
                  const isDisabled = t === 'thumbnail' && !form.substoryId;
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("label", {
                    style: isDisabled ? {
                      opacity: 0.5
                    } : undefined,
                    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                      type: "radio",
                      name: "icon-type",
                      value: t,
                      checked: form.iconType === t,
                      disabled: isDisabled,
                      onChange: () => set('iconType', t)
                    }), ' ', t === 'thumbnail' ? 'Thumbnail' : t.charAt(0).toUpperCase() + t.slice(1)]
                  }, t);
                })
              }), form.iconType === 'thumbnail' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
                className: "description",
                style: {
                  marginTop: 6
                },
                children: "Uses the substory\u2019s featured image, clipped to a circle."
              }), !form.substoryId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
                className: "description",
                style: {
                  marginTop: 6,
                  color: '#888'
                },
                children: "Link a substory above to enable the Thumbnail option."
              })]
            }), form.iconType === 'icon' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row cns-form-row--full",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                children: "Icon Image"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
                style: {
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center'
                },
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
                  type: "button",
                  className: "button",
                  onClick: () => {
                    if (!window.wp?.media) return;
                    const frame = window.wp.media({
                      title: 'Select Icon',
                      button: {
                        text: 'Use this icon'
                      },
                      multiple: false
                    });
                    frame.on('select', () => {
                      const attachment = frame.state().get('selection').first().toJSON();
                      set('iconId', attachment.id);
                    });
                    frame.open();
                  },
                  children: form.iconId ? `Icon #${form.iconId}` : 'Select Icon'
                }), form.iconId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
                  type: "button",
                  className: "button",
                  onClick: () => set('iconId', null),
                  children: "Remove"
                })]
              })]
            }), (form.iconType === 'icon' || form.iconType === 'thumbnail') && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row cns-form-row--full",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                children: "Background shape"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
                className: "cns-radio-toggle",
                children: (form.iconType === 'thumbnail' ? ['round', 'square'] : ['none', 'round', 'square']).map(s => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("label", {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                    type: "radio",
                    name: "icon-bg-shape",
                    value: s,
                    checked: form.iconBgShape === s,
                    onChange: () => set('iconBgShape', s)
                  }), ' ', s.charAt(0).toUpperCase() + s.slice(1)]
                }, s))
              })]
            }), (form.iconType === 'icon' || form.iconType === 'thumbnail') && form.iconBgShape !== 'none' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                children: "Background color"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                type: "color",
                value: form.iconBgColor,
                onChange: e => set('iconBgColor', e.target.value)
              })]
            }), !['icon', 'thumbnail'].includes(form.iconType) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                children: "Fill color"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                  type: "color",
                  value: form.iconColor,
                  onChange: e => set('iconColor', e.target.value)
                })
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                children: "Border color"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                type: "color",
                value: form.iconBorderColor,
                onChange: e => set('iconBorderColor', e.target.value)
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                children: "Border width"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
                className: "cns-range-wrap",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                  type: "range",
                  min: "0",
                  max: "10",
                  step: "0.5",
                  value: form.iconBorderWidth,
                  onChange: e => set('iconBorderWidth', parseFloat(e.target.value))
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
                  className: "cns-range-value",
                  children: [form.iconBorderWidth, "px"]
                })]
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                children: "Size"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
                className: "cns-range-wrap",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                  type: "range",
                  min: "0.25",
                  max: "3",
                  step: "0.25",
                  value: form.iconSize,
                  onChange: e => set('iconSize', parseFloat(e.target.value))
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
                  className: "cns-range-value",
                  children: [form.iconSize, "\xD7"]
                })]
              })]
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "cns-modal-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("h3", {
            children: "Story Path"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("select", {
            value: form.pathId ?? '',
            onChange: e => set('pathId', e.target.value ? parseInt(e.target.value, 10) : null),
            className: "regular-text",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("option", {
              value: "",
              children: "\u2014 No path (use global settings) \u2014"
            }), paths.map(p => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("option", {
              value: p.id,
              children: p.label || `Path #${p.id}`
            }, p.id))]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
            className: "description",
            style: {
              marginTop: 6
            },
            children: "Assign this node to a path to inherit its marker settings."
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "cns-modal-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("h3", {
            children: "Individual Marker Override"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
            className: "description",
            style: {
              marginBottom: 10
            },
            children: "Overrides path and global settings for this node only. Leave a field blank to inherit."
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
            className: "cns-form-grid",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row cns-form-row--full",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                children: "Marker type"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
                className: "cns-radio-toggle",
                children: ['inherit', 'ring', 'icon'].map(t => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("label", {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                    type: "radio",
                    name: "node-marker-type",
                    value: t,
                    checked: form.markerType === t,
                    onChange: () => set('markerType', t)
                  }), ' ', t === 'inherit' ? 'Inherit' : t.charAt(0).toUpperCase() + t.slice(1)]
                }, t))
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("label", {
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                  type: "checkbox",
                  checked: form.markerColor !== null,
                  onChange: e => set('markerColor', e.target.checked ? '#00aaff' : null),
                  style: {
                    marginRight: 6
                  }
                }), "Color override"]
              }), form.markerColor !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                type: "color",
                value: form.markerColor,
                onChange: e => set('markerColor', e.target.value)
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("label", {
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                  type: "checkbox",
                  checked: form.markerSize !== null,
                  onChange: e => set('markerSize', e.target.checked ? 5 : null),
                  style: {
                    marginRight: 6
                  }
                }), "Size override"]
              }), form.markerSize !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
                className: "cns-range-wrap",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                  type: "range",
                  min: "1",
                  max: "30",
                  step: "1",
                  value: form.markerSize,
                  onChange: e => set('markerSize', parseFloat(e.target.value))
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
                  className: "cns-range-value",
                  children: [form.markerSize, "px"]
                })]
              })]
            }), form.markerType === 'icon' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row cns-form-row--full",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                children: "Marker icon"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
                style: {
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center'
                },
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
                  type: "button",
                  className: "button",
                  onClick: () => {
                    const frame = window.wp?.media?.({
                      title: 'Select Marker Icon',
                      button: {
                        text: 'Use as marker'
                      },
                      multiple: false,
                      library: {
                        type: 'image'
                      }
                    });
                    if (!frame) return;
                    frame.on('select', () => {
                      const a = frame.state().get('selection').first().toJSON();
                      set('markerIconId', a.id);
                    });
                    frame.open();
                  },
                  children: form.markerIconId ? `Icon #${form.markerIconId}` : 'Select icon'
                }), form.markerIconId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
                  type: "button",
                  className: "button",
                  onClick: () => set('markerIconId', null),
                  children: "Remove"
                })]
              })]
            }), form.markerType === 'icon' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
                className: "cns-form-row",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("label", {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                    type: "checkbox",
                    checked: form.markerIconOffsetX !== null,
                    onChange: e => set('markerIconOffsetX', e.target.checked ? 0 : null),
                    style: {
                      marginRight: 6
                    }
                  }), "Offset X override"]
                }), form.markerIconOffsetX !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                    type: "number",
                    min: "-100",
                    max: "100",
                    step: "1",
                    style: {
                      width: 60
                    },
                    value: form.markerIconOffsetX,
                    onChange: e => set('markerIconOffsetX', parseFloat(e.target.value) || 0)
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("span", {
                    style: {
                      marginLeft: 4
                    },
                    children: "px"
                  })]
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
                className: "cns-form-row",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("label", {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                    type: "checkbox",
                    checked: form.markerIconOffsetY !== null,
                    onChange: e => set('markerIconOffsetY', e.target.checked ? -30 : null),
                    style: {
                      marginRight: 6
                    }
                  }), "Offset Y override"]
                }), form.markerIconOffsetY !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                    type: "number",
                    min: "-100",
                    max: "100",
                    step: "1",
                    style: {
                      width: 60
                    },
                    value: form.markerIconOffsetY,
                    onChange: e => set('markerIconOffsetY', parseFloat(e.target.value) || 0)
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("span", {
                    style: {
                      marginLeft: 4
                    },
                    children: "px"
                  })]
                })]
              })]
            })]
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
        className: "cns-modal__footer",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
          className: "button",
          onClick: onClose,
          children: "Cancel"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
          className: "button button-primary",
          onClick: handleSave,
          disabled: saving,
          children: saving ? 'Saving…' : isNew ? 'Add Node' : 'Save Node'
        })]
      })]
    })]
  });
}

/***/ },

/***/ "./src/admin/app/forms/PathModal.tsx"
/*!*******************************************!*\
  !*** ./src/admin/app/forms/PathModal.tsx ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ PathModal)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _shared_MarkerControls__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/MarkerControls */ "./src/admin/app/shared/MarkerControls.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



function buildInitial(path) {
  return {
    label: path?.label ?? '',
    markerColor: path?.markerColor ?? '#00aaff',
    markerSize: path?.markerSize ?? 5,
    markerType: path?.markerType ?? 'ring',
    markerIconId: path?.markerIconId ?? null,
    markerIconUrl: path?.markerIconUrl ?? '',
    markerIconOffsetX: path?.markerIconOffsetX ?? 0,
    markerIconOffsetY: path?.markerIconOffsetY ?? -30
  };
}
function PathModal({
  path,
  onSave,
  onClose
}) {
  const [form, setForm] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => buildInitial(path));
  const [saving, setSaving] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    document.body.classList.add('cns-modal-open');
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('cns-modal-open');
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  function set(key, value) {
    setForm(p => ({
      ...p,
      [key]: value
    }));
  }
  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }
  const isNew = path === null;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    className: "cns-modal",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": isNew ? 'Add Path' : 'Edit Path',
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: "cns-modal__backdrop",
      onClick: onClose
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "cns-modal__dialog",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "cns-modal__header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h2", {
          className: "cns-modal__title",
          children: isNew ? 'Add Path' : 'Edit Path'
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
          className: "cns-modal__close",
          onClick: onClose,
          "aria-label": "Close",
          children: "\xD7"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "cns-modal__body",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
          className: "cns-modal-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h3", {
            children: "Path Label"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
            type: "text",
            className: "regular-text",
            placeholder: "e.g. Main storyline",
            value: form.label,
            onChange: e => set('label', e.target.value)
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
          className: "cns-modal-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h3", {
            children: "Marker Settings"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
            className: "description",
            style: {
              marginBottom: 10
            },
            children: "These override the global marker for all nodes in this path (unless overridden per-node)."
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_shared_MarkerControls__WEBPACK_IMPORTED_MODULE_1__["default"], {
            markerType: form.markerType,
            markerColor: form.markerColor,
            markerSize: form.markerSize,
            markerIconId: form.markerIconId,
            markerIconUrl: form.markerIconUrl,
            markerIconOffsetX: form.markerIconOffsetX,
            markerIconOffsetY: form.markerIconOffsetY,
            onChange: updates => setForm(p => ({
              ...p,
              ...updates
            }))
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "cns-modal__footer",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
          className: "button",
          onClick: onClose,
          children: "Cancel"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
          className: "button button-primary",
          onClick: handleSave,
          disabled: saving || !form.label.trim(),
          children: saving ? 'Saving…' : isNew ? 'Add Path' : 'Save Path'
        })]
      })]
    })]
  });
}

/***/ },

/***/ "./src/admin/app/panels/LinksPanel.tsx"
/*!*********************************************!*\
  !*** ./src/admin/app/panels/LinksPanel.tsx ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ LinksPanel)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils */ "./src/admin/utils.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



const LINK_TYPE_LABELS = {
  map_object: 'Map Object',
  map_area: 'Map Area',
  hierarchy: 'Hierarchy Region'
};
function LinksPanel({
  storyId: _storyId,
  links,
  onLinkAdd,
  onLinkDelete
}) {
  const [search, setSearch] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [results, setResults] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [loading, setLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [linkType, setLinkType] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('map_object');
  async function handleSearch() {
    setLoading(true);
    try {
      // Query map-suite's REST API for linkable entities.
      let path = '';
      if (linkType === 'map_object') {
        path = '/objects?per_page=50&search=' + encodeURIComponent(search);
      } else if (linkType === 'map_area') {
        path = '/areas?per_page=50&search=' + encodeURIComponent(search);
      } else {
        path = '/hierarchy?per_page=50&search=' + encodeURIComponent(search);
      }
      const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_1__.mapApiFetch)('GET', path);
      const data = await res.json();
      if (res.ok) {
        setResults(data.map(item => ({
          id: item.id,
          title: item.title,
          type: linkType
        })));
      }
    } finally {
      setLoading(false);
    }
  }
  const linkedIds = new Set(links.filter(l => l.linkType === linkType).map(l => l.linkId));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    className: "cns-panel cns-links-panel",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h2", {
      children: "Map Suite Links"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
      className: "description",
      children: "Link this story to specific map objects, areas, or hierarchy regions. These relationships are used for cross-referencing in the map editor."
    }), links.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h3", {
        children: "Linked Entities"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("table", {
        className: "wp-list-table widefat fixed striped",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("thead", {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("tr", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
              children: "Type"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
              children: "Entity"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
              children: "Actions"
            })]
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("tbody", {
          children: links.map(link => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("tr", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("td", {
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                className: "cns-badge",
                children: LINK_TYPE_LABELS[link.linkType]
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("td", {
              children: link.linkTitle || `#${link.linkId}`
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("td", {
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
                className: "button button-small cns-delete-link",
                onClick: () => onLinkDelete(link.id),
                children: "Unlink"
              })
            })]
          }, link.id))
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h3", {
      style: {
        marginTop: 24
      },
      children: "Add Link"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "cns-row-group",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("select", {
        value: linkType,
        onChange: e => {
          setLinkType(e.target.value);
          setResults([]);
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("option", {
          value: "map_object",
          children: "Map Object"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("option", {
          value: "map_area",
          children: "Map Area"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("option", {
          value: "hierarchy",
          children: "Hierarchy Region"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
        type: "search",
        placeholder: "Search\u2026",
        value: search,
        onChange: e => setSearch(e.target.value),
        onKeyDown: e => {
          if (e.key === 'Enter') handleSearch();
        },
        className: "regular-text"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
        className: "button",
        onClick: handleSearch,
        disabled: loading,
        children: loading ? 'Searching…' : 'Search'
      })]
    }), results.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("ul", {
      className: "cns-link-results",
      children: results.map(item => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("li", {
        className: "cns-link-result",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
          children: item.title || `#${item.id}`
        }), linkedIds.has(item.id) ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
          className: "cns-badge",
          children: "Linked"
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
          className: "button button-small button-primary",
          onClick: () => onLinkAdd(linkType, item.id),
          children: "+ Link"
        })]
      }, item.id))
    })]
  });
}

/***/ },

/***/ "./src/admin/app/panels/NodesPanel.tsx"
/*!*********************************************!*\
  !*** ./src/admin/app/panels/NodesPanel.tsx ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ NodesPanel)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);

function getDisplayTitle(node) {
  return node.titleOverride || node.substoryTitle || `Node #${node.id}`;
}
function NodesPanel({
  nodes,
  edges,
  paths,
  startNodeId,
  onEditNode,
  onDeleteNode,
  onSetStartNode,
  onEdgeReorder,
  onEdgeDelete,
  onEditEdge
}) {
  const pathMap = new Map(paths.map(p => [p.id, p]));
  if (!nodes.length) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
      className: "cns-panel",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
        children: "No nodes yet. Switch to the Canvas tab and click to add your first node."
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
    className: "cns-panel cns-nodes-panel",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
      children: "Story Nodes"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
      className: "description",
      children: "Click \"Set Start\" to mark the first node visitors will see. Connections are managed via the Canvas tab."
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("table", {
      className: "wp-list-table widefat fixed striped",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("thead", {
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("th", {
            style: {
              width: 32
            }
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("th", {
            children: "Node"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("th", {
            children: "Substory"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("th", {
            children: "Outgoing connections"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("th", {
            children: "Actions"
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("tbody", {
        children: nodes.map(node => {
          const outEdges = edges.filter(e => e.fromNodeId === node.id).sort((a, b) => a.sortOrder - b.sortOrder);
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("tr", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("td", {
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                className: "cns-node-swatch",
                style: {
                  background: node.iconType === 'thumbnail' || node.iconType === 'icon' ? 'transparent' : node.iconColor,
                  width: 18,
                  height: 18,
                  display: 'inline-block',
                  borderRadius: node.iconType === 'square' || node.iconType === 'diamond' ? 2 : '50%',
                  transform: node.iconType === 'diamond' ? 'rotate(45deg)' : undefined,
                  border: '1px solid rgba(0,0,0,0.3)'
                }
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("td", {
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("strong", {
                children: getDisplayTitle(node)
              }), node.id === startNodeId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                className: "cns-badge cns-badge--featured",
                style: {
                  marginLeft: 6
                },
                children: "Start"
              }), node.pathId && pathMap.has(node.pathId) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                className: "cns-badge",
                style: {
                  marginLeft: 6,
                  background: pathMap.get(node.pathId).markerColor,
                  color: '#fff',
                  fontSize: 10,
                  padding: '1px 5px',
                  borderRadius: 10
                },
                children: pathMap.get(node.pathId).label || `Path #${node.pathId}`
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("td", {
              children: node.substoryId ? node.substoryEditUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                href: node.substoryEditUrl,
                target: "_blank",
                rel: "noopener",
                children: [node.substoryTitle || `Substory #${node.substoryId}`, " \u2197"]
              }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                children: node.substoryTitle || `Substory #${node.substoryId}`
              }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                className: "description",
                children: "\u2014"
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("td", {
              children: [outEdges.length === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                className: "description",
                children: "None"
              }), outEdges.map((edge, i) => {
                const toNode = nodes.find(n => n.id === edge.toNodeId);
                return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                  className: "cns-edge-row",
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", {
                    type: "number",
                    min: "0",
                    value: edge.sortOrder,
                    onChange: e => onEdgeReorder(edge.id, parseInt(e.target.value)),
                    style: {
                      width: 44
                    },
                    title: "Sort order (lower = higher priority)"
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                    children: ["\u2192 ", toNode ? getDisplayTitle(toNode) : `#${edge.toNodeId}`]
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
                    className: "cns-icon-btn",
                    title: "Style this connection",
                    onClick: () => onEditEdge(edge.id),
                    children: "\u2261"
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
                    className: "cns-icon-btn",
                    title: "Delete connection",
                    onClick: () => {
                      if (window.confirm('Delete this connection?')) onEdgeDelete(edge.id);
                    },
                    children: "\u2715"
                  })]
                }, edge.id);
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("td", {
              className: "cns-maps-actions",
              children: [node.id !== startNodeId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
                className: "button button-small",
                onClick: () => onSetStartNode(node.id),
                children: "Set Start"
              }), ' ', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
                className: "button button-small",
                onClick: () => onEditNode(node.id),
                children: "Edit"
              }), ' ', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
                className: "button button-small cns-delete-link",
                onClick: () => {
                  if (window.confirm('Delete this node and all its connections?')) {
                    onDeleteNode(node.id);
                  }
                },
                children: "Delete"
              })]
            })]
          }, node.id);
        })
      })]
    })]
  });
}

/***/ },

/***/ "./src/admin/app/panels/PathsPanel.tsx"
/*!*********************************************!*\
  !*** ./src/admin/app/panels/PathsPanel.tsx ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ PathsPanel)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _forms_PathModal__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../forms/PathModal */ "./src/admin/app/forms/PathModal.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



function PathsPanel({
  paths,
  onCreatePath,
  onUpdatePath,
  onDeletePath
}) {
  const [modal, setModal] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({
    open: false,
    path: null
  });
  async function handleSave(data) {
    if (modal.path) {
      await onUpdatePath(modal.path.id, data);
    } else {
      await onCreatePath(data);
    }
    setModal({
      open: false,
      path: null
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    className: "cns-panel cns-paths-panel",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h2", {
      children: "Story Paths"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
      className: "description",
      children: "Paths group nodes so you can apply shared marker settings. Assign nodes to a path via the node editor. Priority order: individual node settings > path settings > global settings."
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      style: {
        marginBottom: 12
      },
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
        type: "button",
        className: "button button-primary",
        onClick: () => setModal({
          open: true,
          path: null
        }),
        children: "+ Add Path"
      })
    }), paths.length === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
      className: "description",
      children: "No paths yet."
    }), paths.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("table", {
      className: "wp-list-table widefat fixed striped",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("thead", {
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
            style: {
              width: 24
            }
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
            children: "Label"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
            style: {
              width: 80
            },
            children: "Marker"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
            style: {
              width: 120
            },
            children: "Actions"
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("tbody", {
        children: paths.map(path => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("td", {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              style: {
                display: 'inline-block',
                width: 14,
                height: 14,
                borderRadius: path.markerType === 'ring' ? '50%' : 3,
                background: path.markerType === 'ring' ? 'transparent' : path.markerColor,
                border: `3px solid ${path.markerColor}`,
                verticalAlign: 'middle'
              }
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("td", {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("strong", {
              children: path.label || `Path #${path.id}`
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("td", {
            style: {
              fontSize: 12,
              color: '#666'
            },
            children: path.markerType === 'ring' ? 'Ring' : 'Icon'
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("td", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
              className: "button button-small",
              onClick: () => setModal({
                open: true,
                path
              }),
              children: "Edit"
            }), ' ', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
              className: "button button-small cns-delete-link",
              onClick: () => {
                if (window.confirm(`Delete path "${path.label}"? Nodes will become unassigned.`)) {
                  onDeletePath(path.id);
                }
              },
              children: "Delete"
            })]
          })]
        }, path.id))
      })]
    }), modal.open && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_forms_PathModal__WEBPACK_IMPORTED_MODULE_1__["default"], {
      path: modal.path,
      onSave: handleSave,
      onClose: () => setModal({
        open: false,
        path: null
      })
    })]
  });
}

/***/ },

/***/ "./src/admin/app/panels/SettingsPanel.tsx"
/*!************************************************!*\
  !*** ./src/admin/app/panels/SettingsPanel.tsx ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ SettingsPanel)
/* harmony export */ });
/* harmony import */ var _shared_MapPicker__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../shared/MapPicker */ "./src/admin/app/shared/MapPicker.tsx");
/* harmony import */ var _shared_MarkerControls__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/MarkerControls */ "./src/admin/app/shared/MarkerControls.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



function SettingsPanel({
  settings,
  onChange,
  onMapChange
}) {
  function set(key, value) {
    onChange({
      ...settings,
      [key]: value
    });
  }
  function openThumbnailPicker() {
    const frame = window.wp?.media?.({
      title: 'Select Story Thumbnail',
      button: {
        text: 'Use as thumbnail'
      },
      multiple: false,
      library: {
        type: 'image'
      }
    });
    if (!frame) return;
    frame.on('select', () => {
      const att = frame.state().get('selection').first().toJSON();
      onChange({
        ...settings,
        thumbnailId: att.id,
        thumbnailUrl: att.url
      });
    });
    frame.open();
  }
  function removeThumbnail() {
    onChange({
      ...settings,
      thumbnailId: null,
      thumbnailUrl: ''
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    className: "cns-panel cns-settings-panel",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h2", {
      children: "Story Settings"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("table", {
      className: "form-table",
      role: "presentation",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("tbody", {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
            scope: "row",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("label", {
              htmlFor: "story-title",
              children: "Title"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("td", {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
              id: "story-title",
              type: "text",
              className: "regular-text",
              value: settings.title,
              onChange: e => set('title', e.target.value)
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
            scope: "row",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("label", {
              children: "Thumbnail"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("td", {
            children: [settings.thumbnailUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
              style: {
                marginBottom: 8
              },
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("img", {
                src: settings.thumbnailUrl,
                alt: "",
                style: {
                  maxWidth: 120,
                  maxHeight: 80,
                  display: 'block',
                  borderRadius: 4,
                  border: '1px solid #ddd'
                }
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
              style: {
                display: 'flex',
                gap: 8
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
                type: "button",
                className: "button",
                onClick: openThumbnailPicker,
                children: settings.thumbnailId ? 'Change thumbnail' : 'Set thumbnail'
              }), settings.thumbnailId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
                type: "button",
                className: "button",
                onClick: removeThumbnail,
                children: "Remove"
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
              className: "description",
              children: "Used as the story\u2019s featured image."
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
            scope: "row",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("label", {
              htmlFor: "story-description",
              children: "Description"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("td", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("textarea", {
              id: "story-description",
              className: "large-text",
              rows: 3,
              value: settings.description,
              onChange: e => set('description', e.target.value)
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
              className: "description",
              children: "Short summary shown in story listings."
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
            scope: "row",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("label", {
              children: "Map"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("td", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_shared_MapPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
              mapId: settings.mapId,
              mapTitle: settings.mapTitle,
              onChange: onMapChange
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
              className: "description",
              children: "The story canvas overlays this map. Objects and areas are shown read-only."
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("th", {
            scope: "row",
            children: "Active node marker"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("td", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_shared_MarkerControls__WEBPACK_IMPORTED_MODULE_1__["default"], {
              markerType: settings.markerType,
              markerColor: settings.markerColor,
              markerSize: settings.markerSize,
              markerIconId: settings.markerIconId,
              markerIconUrl: settings.markerIconUrl,
              markerIconOffsetX: settings.markerIconOffsetX,
              markerIconOffsetY: settings.markerIconOffsetY,
              onChange: updates => onChange({
                ...settings,
                ...updates
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
              className: "description",
              style: {
                marginTop: 8
              },
              children: "Global default. Overridden per-path and per-node."
            })]
          })]
        })]
      })
    })]
  });
}

/***/ },

/***/ "./src/admin/app/shared/MapPicker.tsx"
/*!********************************************!*\
  !*** ./src/admin/app/shared/MapPicker.tsx ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MapPicker)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


function MapPicker({
  mapId,
  mapTitle,
  onChange
}) {
  const [query, setQuery] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [results, setResults] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [loading, setLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [open, setOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      // Use WP REST API to search the maps CPT.
      const g = window.cnsStorySuite;
      const url = g.wpRestUrl + '/maps?search=' + encodeURIComponent(query) + '&per_page=20&status=publish,private,draft';
      const res = await fetch(url, {
        headers: {
          'X-WP-Nonce': g.nonce
        }
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data.map(m => ({
          id: m.id,
          title: m.title.rendered,
          thumbnailUrl: ''
        })));
      }
    } finally {
      setLoading(false);
    }
  }
  function handleSelect(item) {
    onChange(item.id, item.title);
    setOpen(false);
    setQuery('');
    setResults([]);
  }
  function handleClear() {
    onChange(null, '');
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("div", {
    className: "cns-map-picker",
    children: mapId ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
      className: "cns-picker-selected",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("span", {
        children: mapTitle || `Map #${mapId}`
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
        type: "button",
        className: "button button-small",
        onClick: handleClear,
        children: "Change"
      })]
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
        className: "cns-row-group",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("input", {
          type: "search",
          placeholder: "Search maps\u2026",
          value: query,
          onChange: e => setQuery(e.target.value),
          onKeyDown: e => {
            if (e.key === 'Enter') {
              setOpen(true);
              search();
            }
          },
          className: "regular-text"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
          type: "button",
          className: "button",
          onClick: () => {
            setOpen(true);
            search();
          },
          disabled: loading,
          children: loading ? 'Searching…' : 'Search'
        })]
      }), open && results.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("ul", {
        className: "cns-picker-results",
        children: results.map(item => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("li", {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("button", {
            type: "button",
            onClick: () => handleSelect(item),
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("span", {
              children: item.title
            })
          })
        }, item.id))
      }), open && !loading && results.length === 0 && query && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("p", {
        className: "description",
        children: "No maps found."
      })]
    })
  });
}

/***/ },

/***/ "./src/admin/app/shared/MarkerControls.tsx"
/*!*************************************************!*\
  !*** ./src/admin/app/shared/MarkerControls.tsx ***!
  \*************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MarkerControls)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);

const PRESETS = [{
  label: 'Top',
  x: 0,
  y: -30
}, {
  label: 'Bottom',
  x: 0,
  y: 30
}, {
  label: 'Left',
  x: -30,
  y: 0
}, {
  label: 'Right',
  x: 30,
  y: 0
}, {
  label: 'Center',
  x: 0,
  y: 0
}];
function MarkerControls({
  markerType,
  markerColor,
  markerSize,
  markerIconId,
  markerIconUrl,
  markerIconOffsetX,
  markerIconOffsetY,
  onChange
}) {
  function openIconPicker() {
    const frame = window.wp?.media?.({
      title: 'Select Marker Icon',
      button: {
        text: 'Use as marker'
      },
      multiple: false,
      library: {
        type: 'image'
      }
    });
    if (!frame) return;
    frame.on('select', () => {
      const att = frame.state().get('selection').first().toJSON();
      onChange({
        markerIconId: att.id,
        markerIconUrl: att.url
      });
    });
    frame.open();
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
    className: "cns-marker-controls",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
      className: "cns-form-row cns-form-row--full",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", {
        children: "Type"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
        className: "cns-radio-toggle",
        children: ['ring', 'icon'].map(t => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", {
            type: "radio",
            name: "mc-type",
            value: t,
            checked: markerType === t,
            onChange: () => onChange({
              markerType: t
            })
          }), ' ', t === 'ring' ? 'Ring outline' : 'Icon image']
        }, t))
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
      className: "cns-form-row",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", {
        children: "Color"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", {
        type: "color",
        value: markerColor,
        onChange: e => onChange({
          markerColor: e.target.value
        })
      })]
    }), markerType === 'ring' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
      className: "cns-form-row",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", {
        children: "Ring size"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "cns-range-wrap",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", {
          type: "range",
          min: "1",
          max: "30",
          step: "1",
          value: markerSize,
          onChange: e => onChange({
            markerSize: parseFloat(e.target.value)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
          className: "cns-range-value",
          children: [markerSize, "px"]
        })]
      })]
    }), markerType === 'icon' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "cns-form-row cns-form-row--full",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", {
          children: "Icon image"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
          style: {
            display: 'flex',
            gap: 8,
            alignItems: 'center'
          },
          children: [markerIconUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", {
            src: markerIconUrl,
            alt: "",
            style: {
              width: 32,
              height: 32,
              objectFit: 'contain',
              border: '1px solid #ddd',
              borderRadius: 4
            }
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
            type: "button",
            className: "button",
            onClick: openIconPicker,
            children: markerIconId ? 'Change icon' : 'Select icon'
          }), markerIconId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
            type: "button",
            className: "button",
            onClick: () => onChange({
              markerIconId: null,
              markerIconUrl: ''
            }),
            children: "Remove"
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "cns-form-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", {
          children: "Icon size"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
          className: "cns-range-wrap",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", {
            type: "range",
            min: "1",
            max: "30",
            step: "1",
            value: markerSize,
            onChange: e => onChange({
              markerSize: parseFloat(e.target.value)
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
            className: "cns-range-value",
            children: [markerSize, "px"]
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "cns-form-row cns-form-row--full",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", {
          children: "Position preset"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
          style: {
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap'
          },
          children: PRESETS.map(preset => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
            type: "button",
            className: "button button-small",
            style: {
              fontWeight: markerIconOffsetX === preset.x && markerIconOffsetY === preset.y ? 'bold' : undefined
            },
            onClick: () => onChange({
              markerIconOffsetX: preset.x,
              markerIconOffsetY: preset.y
            }),
            children: preset.label
          }, preset.label))
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "cns-form-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", {
          children: "Offset X"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", {
          type: "number",
          min: "-100",
          max: "100",
          step: "1",
          style: {
            width: 60
          },
          value: markerIconOffsetX,
          onChange: e => onChange({
            markerIconOffsetX: parseFloat(e.target.value) || 0
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
          style: {
            marginLeft: 4
          },
          children: "px"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "cns-form-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", {
          children: "Offset Y"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", {
          type: "number",
          min: "-100",
          max: "100",
          step: "1",
          style: {
            width: 60
          },
          value: markerIconOffsetY,
          onChange: e => onChange({
            markerIconOffsetY: parseFloat(e.target.value) || 0
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
          style: {
            marginLeft: 4
          },
          children: "px"
        })]
      })]
    })]
  });
}

/***/ },

/***/ "./src/admin/app/shared/SubstoryPicker.tsx"
/*!*************************************************!*\
  !*** ./src/admin/app/shared/SubstoryPicker.tsx ***!
  \*************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ SubstoryPicker)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils */ "./src/admin/utils.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



function SubstoryPicker({
  substoryId,
  substoryLabel,
  onChange
}) {
  const [query, setQuery] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [results, setResults] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [loading, setLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [open, setOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!open) return;
    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [query, open]);
  async function search() {
    setLoading(true);
    try {
      const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_1__.apiFetch)('GET', `/substories?search=${encodeURIComponent(query)}&per_page=20`);
      const data = await res.json();
      if (res.ok) setResults(data);
    } finally {
      setLoading(false);
    }
  }
  function handleSelect(item) {
    onChange(item.id, item.title);
    setOpen(false);
    setQuery('');
  }
  function handleClear() {
    onChange(null, '');
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
    className: "cns-substory-picker",
    children: substoryId ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "cns-picker-selected",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
        children: substoryLabel || `Substory #${substoryId}`
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
        type: "button",
        className: "button button-small",
        onClick: handleClear,
        children: "Remove"
      })]
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
        type: "button",
        className: "button",
        onClick: () => {
          setOpen(p => !p);
          if (!open) setQuery('');
        },
        children: open ? 'Close' : '+ Connect Substory Post'
      }), open && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "cns-picker-dropdown",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
          type: "search",
          placeholder: "Search substories\u2026",
          value: query,
          onChange: e => setQuery(e.target.value),
          autoFocus: true,
          className: "regular-text"
        }), loading && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
          className: "cns-picker-loading",
          children: "Searching\u2026"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("ul", {
          className: "cns-picker-results",
          children: [results.map(item => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("li", {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("button", {
              type: "button",
              onClick: () => handleSelect(item),
              children: [item.thumbnailUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("img", {
                src: item.thumbnailUrl,
                alt: "",
                width: "32",
                height: "32"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                children: item.title
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("small", {
                children: item.status
              })]
            })
          }, item.id)), !loading && results.length === 0 && query && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("li", {
            className: "cns-picker-empty",
            children: "No substories found."
          })]
        })]
      })]
    })
  });
}

/***/ },

/***/ "./src/admin/canvas/StoryCanvas.tsx"
/*!******************************************!*\
  !*** ./src/admin/canvas/StoryCanvas.tsx ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ StoryCanvas)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _canvas__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./canvas */ "./src/admin/canvas/canvas.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



function StoryCanvas({
  mapData,
  mapObjects,
  mapAreas,
  nodes,
  edges,
  paths,
  selectedNodeId,
  edgeStartNodeId,
  isEdgeMode,
  lineColor,
  lineWidth,
  lineStyle,
  lineOpacity,
  markerColor,
  markerSize,
  markerType,
  markerIconUrl,
  markerIconOffsetX,
  markerIconOffsetY,
  onNodeClick,
  onCanvasClick,
  onEdgeClick,
  onNodeDragEnd
}) {
  const canvasRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const stateRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)({
    mapData,
    mapObjects,
    mapAreas,
    nodes,
    edges,
    paths,
    selectedNodeId,
    edgeStartNodeId,
    isEdgeMode,
    lineColor,
    lineWidth,
    lineStyle,
    lineOpacity,
    markerColor,
    markerSize,
    markerType,
    markerIconUrl,
    markerIconOffsetX,
    markerIconOffsetY
  });
  const dragging = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const mousePos = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const animFrame = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(0);
  const canvasW = mapData?.width ?? 900;
  const canvasH = mapData ? Math.round(mapData.width * mapData.aspectRatio) : 600;

  // Keep stateRef current and sync cursor whenever isEdgeMode changes.
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    stateRef.current = {
      mapData,
      mapObjects,
      mapAreas,
      nodes,
      edges,
      paths,
      selectedNodeId,
      edgeStartNodeId,
      isEdgeMode,
      lineColor,
      lineWidth,
      lineStyle,
      lineOpacity,
      markerColor,
      markerSize,
      markerType,
      markerIconUrl,
      markerIconOffsetX,
      markerIconOffsetY
    };
    if (canvasRef.current && !dragging.current) {
      canvasRef.current.style.cursor = isEdgeMode ? 'crosshair' : 'default';
    }
  });

  // Preload all image URLs.
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const urls = [];
    if (mapData?.bgImageUrl) urls.push(mapData.bgImageUrl);
    if (mapData?.imageUrl) urls.push(mapData.imageUrl);
    mapObjects.forEach(o => {
      if (o.iconUrl) urls.push(o.iconUrl);
    });
    nodes.forEach(n => {
      if (n.iconUrl) urls.push(n.iconUrl);
      if (n.markerIconUrl) urls.push(n.markerIconUrl);
    });
    paths.forEach(p => {
      if (p.markerIconUrl) urls.push(p.markerIconUrl);
    });
    if (markerIconUrl) urls.push(markerIconUrl);
    (0,_canvas__WEBPACK_IMPORTED_MODULE_1__.preloadImages)(urls);
  }, [mapData, mapObjects, nodes, paths, markerIconUrl]);

  // Render loop.
  const render = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    const W = canvas.width;
    const H = canvas.height;
    (0,_canvas__WEBPACK_IMPORTED_MODULE_1__.drawStory)(ctx, W, H, s);

    // Pending edge overlay.
    if (s.isEdgeMode && s.edgeStartNodeId !== null && mousePos.current) {
      const fromNode = s.nodes.find(n => n.id === s.edgeStartNodeId);
      if (fromNode) {
        (0,_canvas__WEBPACK_IMPORTED_MODULE_1__.drawPendingEdge)(ctx, W, H, fromNode, mousePos.current.x, mousePos.current.y, s.lineColor);
      }
    }
    animFrame.current = requestAnimationFrame(render);
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    animFrame.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame.current);
  }, [render]);

  // ── Pointer helpers ───────────────────────────────────────────────────────

  function getCanvasCoords(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }
  function setCursor(cursor) {
    if (canvasRef.current) canvasRef.current.style.cursor = cursor;
  }

  // ── Mouse handlers ────────────────────────────────────────────────────────

  function handleMouseDown(e) {
    if (e.button !== 0) return;
    const {
      x,
      y
    } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const s = stateRef.current;
    const nodeId = (0,_canvas__WEBPACK_IMPORTED_MODULE_1__.getNodeAtPoint)(x, y, s.nodes, canvas.width, canvas.height);
    if (nodeId !== null) {
      dragging.current = {
        nodeId,
        startX: x,
        startY: y
      };
      setCursor('grabbing');
    }
  }
  function handleMouseMove(e) {
    const {
      x,
      y
    } = getCanvasCoords(e);
    mousePos.current = {
      x,
      y
    };
    if (dragging.current) return; // cursor already 'grabbing'

    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (s.isEdgeMode) {
      setCursor('crosshair');
      return;
    }
    const nodeId = (0,_canvas__WEBPACK_IMPORTED_MODULE_1__.getNodeAtPoint)(x, y, s.nodes, canvas.width, canvas.height);
    setCursor(nodeId !== null ? 'grab' : 'default');
  }
  function handleMouseUp(e) {
    if (e.button !== 0) return;
    const {
      x,
      y
    } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (dragging.current) {
      const {
        nodeId,
        startX,
        startY
      } = dragging.current;
      dragging.current = null;
      const dx = x - startX;
      const dy = y - startY;
      if (Math.sqrt(dx * dx + dy * dy) > 4) {
        const nx = Math.max(0, Math.min(1, x / canvas.width));
        const ny = Math.max(0, Math.min(1, y / canvas.height));
        onNodeDragEnd(nodeId, nx, ny);
      } else {
        // Short movement = click: select the node.
        onNodeClick(nodeId);
      }

      // Restore hover cursor.
      const hoverNodeId = (0,_canvas__WEBPACK_IMPORTED_MODULE_1__.getNodeAtPoint)(x, y, s.nodes, canvas.width, canvas.height);
      setCursor(s.isEdgeMode ? 'crosshair' : hoverNodeId !== null ? 'grab' : 'default');
      return;
    }
    const nodeId = (0,_canvas__WEBPACK_IMPORTED_MODULE_1__.getNodeAtPoint)(x, y, s.nodes, canvas.width, canvas.height);
    if (nodeId !== null) {
      onNodeClick(nodeId);
      return;
    }
    const edgeId = (0,_canvas__WEBPACK_IMPORTED_MODULE_1__.getEdgeAtPoint)(x, y, s.edges, s.nodes, canvas.width, canvas.height);
    if (edgeId !== null) {
      onEdgeClick(edgeId);
      return;
    }

    // Empty canvas click — add node or cancel edge mode.
    const nx = Math.max(0, Math.min(1, x / canvas.width));
    const ny = Math.max(0, Math.min(1, y / canvas.height));
    onCanvasClick(nx, ny);
  }
  function handleMouseLeave() {
    mousePos.current = null;
    if (!dragging.current) {
      setCursor(stateRef.current.isEdgeMode ? 'crosshair' : 'default');
    }
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("canvas", {
    ref: canvasRef,
    width: canvasW,
    height: canvasH,
    style: {
      maxWidth: '100%',
      height: 'auto',
      display: 'block'
    },
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave
  });
}

/***/ },

/***/ "./src/admin/canvas/canvas.ts"
/*!************************************!*\
  !*** ./src/admin/canvas/canvas.ts ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   drawPendingEdge: () => (/* binding */ drawPendingEdge),
/* harmony export */   drawStory: () => (/* binding */ drawStory),
/* harmony export */   getEdgeAtPoint: () => (/* binding */ getEdgeAtPoint),
/* harmony export */   getNodeAtPoint: () => (/* binding */ getNodeAtPoint),
/* harmony export */   loadImage: () => (/* binding */ loadImage),
/* harmony export */   preloadImages: () => (/* binding */ preloadImages)
/* harmony export */ });
// ── Image cache ───────────────────────────────────────────────────────────────

const imageCache = new Map();
function loadImage(url) {
  if (imageCache.has(url)) return imageCache.get(url);
  const img = new Image();
  img.src = url;
  imageCache.set(url, img);
  return img;
}
function preloadImages(urls) {
  urls.forEach(loadImage);
}

// ── Draw state ────────────────────────────────────────────────────────────────

// ── Main draw entry ───────────────────────────────────────────────────────────

function drawStory(ctx, W, H, state) {
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, W, H, state);
  drawMapImage(ctx, W, H, state);
  drawMapAreas(ctx, W, H, state);
  drawMapObjects(ctx, W, H, state);
  drawEdges(ctx, W, H, state);
  drawNodes(ctx, W, H, state);
}

// ── Layer: background ─────────────────────────────────────────────────────────

function drawBackground(ctx, W, H, state) {
  const bg = state.mapData;
  if (bg?.bgType === 'image' && bg.bgImageUrl) {
    const img = loadImage(bg.bgImageUrl);
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, 0, 0, W, H);
      return;
    }
    img.onload = () => {};
  }
  ctx.fillStyle = bg?.bgColor ?? '#1a1a2e';
  ctx.fillRect(0, 0, W, H);
}

// ── Layer: map main image ─────────────────────────────────────────────────────

function drawMapImage(ctx, W, H, state) {
  const m = state.mapData;
  if (!m?.imageUrl) return;
  const img = loadImage(m.imageUrl);
  if (!img.complete || !img.naturalWidth) return;
  const iw = m.imageW * W;
  const ih = iw / img.naturalWidth * img.naturalHeight;
  ctx.drawImage(img, m.imageX * W, m.imageY * H, iw, ih);
}

// ── Layer: map areas (read-only, dimmed) ──────────────────────────────────────

function drawMapAreas(ctx, W, H, state) {
  if (!state.mapData) return;
  ctx.save();
  for (const area of state.mapAreas) {
    const pts = area.nodes;
    if (pts.length < 2) continue;
    const s = area.canvasStyles;
    ctx.beginPath();
    ctx.moveTo(pts[0].x * W, pts[0].y * H);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * W, pts[i].y * H);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.15 * (s?.fillOpacity ?? 1);
    ctx.fillStyle = s?.fill ?? '#888888';
    ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = s?.stroke ?? '#aaaaaa';
    ctx.lineWidth = s?.strokeWidth ?? 1;
    ctx.setLineDash([]);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Layer: map objects (read-only, dimmed) ────────────────────────────────────

function drawMapObjects(ctx, W, H, state) {
  if (!state.mapData) return;
  const {
    width: mapW,
    aspectRatio
  } = state.mapData;
  const mapH = mapW * aspectRatio;
  ctx.save();
  ctx.globalAlpha = 0.4;
  for (const obj of state.mapObjects) {
    const cx = obj.x / mapW * W;
    const cy = obj.y / mapH * H;
    const size = (obj.canvasStyles?.size ?? 32) * (W / mapW);
    if (obj.iconUrl) {
      const img = loadImage(obj.iconUrl);
      if (img.complete && img.naturalWidth) {
        ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
        continue;
      }
    }
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = obj.canvasStyles?.fillStyle ?? '#888888';
    ctx.fill();
  }
  ctx.restore();
}

// ── Layer: story edges ────────────────────────────────────────────────────────

function drawEdges(ctx, W, H, state) {
  if (!state.nodes.length || !state.edges.length) return;
  const nodeMap = new Map(state.nodes.map(n => [n.id, n]));
  for (const edge of state.edges) {
    const color = edge.lineColor ?? state.lineColor;
    const width = edge.lineWidth ?? state.lineWidth;
    const lstyle = edge.lineStyle ?? state.lineStyle;
    const opacity = edge.lineOpacity ?? state.lineOpacity;
    const from = nodeMap.get(edge.fromNodeId);
    const to = nodeMap.get(edge.toNodeId);
    if (!from || !to) continue;
    const fx = from.x * W,
      fy = from.y * H;
    const tx = to.x * W,
      ty = to.y * H;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = opacity;
    if (lstyle === 'dashed') ctx.setLineDash([10, 5]);else if (lstyle === 'dotted') ctx.setLineDash([2, 5]);else ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.restore();
    drawArrowhead(ctx, fx, fy, tx, ty, width, color, opacity);
  }
}
function drawArrowhead(ctx, fx, fy, tx, ty, lineWidth, color, alpha) {
  const angle = Math.atan2(ty - fy, tx - fx);
  const arrowSize = Math.max(10, lineWidth * 3);
  const nodeRadius = 16;
  const endX = tx - Math.cos(angle) * nodeRadius;
  const endY = ty - Math.sin(angle) * nodeRadius;
  ctx.save();
  ctx.setLineDash([]);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Layer: story nodes ────────────────────────────────────────────────────────

const NODE_BASE_RADIUS = 14;
function drawNodes(ctx, W, H, state) {
  for (const node of state.nodes) {
    const cx = node.x * W;
    const cy = node.y * H;
    const isSelected = node.id === state.selectedNodeId;
    const isEdgeSrc = node.id === state.edgeStartNodeId;
    drawNode(ctx, cx, cy, node, isSelected, isEdgeSrc, state);
  }
}
function drawNode(ctx, cx, cy, node, isSelected, isEdgeSrc, state) {
  const r = NODE_BASE_RADIUS * node.iconSize;
  const borderColor = node.iconBorderColor || '#000000';
  const borderWidth = node.iconBorderWidth ?? 2;

  // Resolve marker settings: node > path > global
  const path = node.pathId ? state.paths.find(p => p.id === node.pathId) ?? null : null;
  const markerColor = node.markerColor ?? path?.markerColor ?? state.markerColor;
  const markerSize = node.markerSize ?? path?.markerSize ?? state.markerSize;
  const mOffX = node.markerIconOffsetX ?? path?.markerIconOffsetX ?? state.markerIconOffsetX;
  const mOffY = node.markerIconOffsetY ?? path?.markerIconOffsetY ?? state.markerIconOffsetY;
  const mType = node.markerType !== 'inherit' ? node.markerType : path?.markerType ?? state.markerType;
  const mIconUrl = node.markerType === 'icon' ? node.markerIconUrl || path?.markerIconUrl || state.markerIconUrl : node.markerType === 'inherit' ? path?.markerType === 'icon' ? path.markerIconUrl || state.markerIconUrl : state.markerType === 'icon' ? state.markerIconUrl : '' : '';

  // Selection / edge-source marker
  if (isSelected || isEdgeSrc) {
    if (!isEdgeSrc && mType === 'icon' && mIconUrl) {
      const img = loadImage(mIconUrl);
      if (img.complete && img.naturalWidth) {
        const mR = r * 0.8;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.drawImage(img, cx + mOffX - mR, cy + mOffY - mR, mR * 2, mR * 2);
        ctx.restore();
      }
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r + markerSize, 0, Math.PI * 2);
      ctx.strokeStyle = isEdgeSrc ? '#ffcc00' : markerColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Thumbnail ────────────────────────────────────────────────────────────
  if (node.iconType === 'thumbnail' && node.substoryThumbnailUrl) {
    const img = loadImage(node.substoryThumbnailUrl);
    if (img.complete && img.naturalWidth) {
      const useSquare = node.iconBgShape === 'square';
      ctx.save();
      if (useSquare) {
        if (node.iconBgColor) {
          ctx.fillStyle = node.iconBgColor;
          ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        }
        ctx.beginPath();
        ctx.rect(cx - r, cy - r, r * 2, r * 2);
        ctx.clip();
        ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      } else {
        // round (default)
        if (node.iconBgColor) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = node.iconBgColor;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      }
      ctx.restore();
      if (borderWidth > 0) {
        ctx.save();
        ctx.beginPath();
        if (useSquare) ctx.rect(cx - r, cy - r, r * 2, r * 2);else ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
  }

  // ── Icon (image from library) ────────────────────────────────────────────
  if (node.iconType === 'icon' && node.iconUrl) {
    const img = loadImage(node.iconUrl);
    if (img.complete && img.naturalWidth) {
      if (node.iconBgShape !== 'none') {
        ctx.save();
        if (node.iconBgShape === 'square') {
          ctx.fillStyle = node.iconBgColor || '#ffffff';
          ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
          if (borderWidth > 0) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;
            ctx.setLineDash([]);
            ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
          }
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = node.iconBgColor || '#ffffff';
          ctx.fill();
          if (borderWidth > 0) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;
            ctx.setLineDash([]);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      return;
    }
  }

  // ── Diamond ──────────────────────────────────────────────────────────────
  if (node.iconType === 'diamond') {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fillStyle = node.iconColor;
    ctx.fill();
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.setLineDash([]);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // ── Square ───────────────────────────────────────────────────────────────
  if (node.iconType === 'square') {
    ctx.save();
    ctx.fillStyle = node.iconColor;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.setLineDash([]);
      ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
    }
    ctx.restore();
    return;
  }

  // ── Round (default / thumbnail fallback) ─────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = node.iconColor;
  ctx.fill();
  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.setLineDash([]);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Hit testing ───────────────────────────────────────────────────────────────

function getNodeAtPoint(mouseX, mouseY, nodes, W, H) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const cx = n.x * W;
    const cy = n.y * H;
    const r = NODE_BASE_RADIUS * n.iconSize + 5;
    if ((mouseX - cx) ** 2 + (mouseY - cy) ** 2 <= r ** 2) {
      return n.id;
    }
  }
  return null;
}
function getEdgeAtPoint(mouseX, mouseY, edges, nodes, W, H, threshold = 8) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  for (const edge of edges) {
    const from = nodeMap.get(edge.fromNodeId);
    const to = nodeMap.get(edge.toNodeId);
    if (!from || !to) continue;
    const fx = from.x * W;
    const fy = from.y * H;
    const tx = to.x * W;
    const ty = to.y * H;

    // Distance from point to line segment.
    const dx = tx - fx;
    const dy = ty - fy;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) continue;
    const t = Math.max(0, Math.min(1, ((mouseX - fx) * dx + (mouseY - fy) * dy) / (len * len)));
    const px = fx + t * dx;
    const py = fy + t * dy;
    const dist = Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2);
    if (dist <= threshold) return edge.id;
  }
  return null;
}

// ── Edge-in-progress overlay ──────────────────────────────────────────────────

function drawPendingEdge(ctx, W, H, fromNode, mouseX, mouseY, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(fromNode.x * W, fromNode.y * H);
  ctx.lineTo(mouseX, mouseY);
  ctx.stroke();
  ctx.restore();
}

/***/ },

/***/ "./src/admin/utils.ts"
/*!****************************!*\
  !*** ./src/admin/utils.ts ***!
  \****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   apiFetch: () => (/* binding */ apiFetch),
/* harmony export */   mapApiFetch: () => (/* binding */ mapApiFetch)
/* harmony export */ });
function apiFetch(method, path, body) {
  const g = window.cnsStorySuite;
  const url = g.restUrl + path;
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': g.nonce
    },
    body: body ? JSON.stringify(body) : undefined
  });
}
function mapApiFetch(method, path, body) {
  const g = window.cnsStorySuite;
  const url = g.mapRestUrl + path;
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': g.nonce
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

/***/ },

/***/ "./src/admin/admin.scss"
/*!******************************!*\
  !*** ./src/admin/admin.scss ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "react/jsx-runtime"
/*!**********************************!*\
  !*** external "ReactJSXRuntime" ***!
  \**********************************/
(module) {

module.exports = window["ReactJSXRuntime"];

/***/ },

/***/ "@wordpress/element"
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["element"];

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*****************************!*\
  !*** ./src/admin/index.tsx ***!
  \*****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _admin_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./admin.scss */ "./src/admin/admin.scss");
/* harmony import */ var _app_StoryEditorApp__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./app/StoryEditorApp */ "./src/admin/app/StoryEditorApp.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);




const root = document.getElementById('cns-admin-root');
if (root) {
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createRoot)(root).render(/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_app_StoryEditorApp__WEBPACK_IMPORTED_MODULE_2__["default"], {}));
}
})();

/******/ })()
;
//# sourceMappingURL=index.js.map