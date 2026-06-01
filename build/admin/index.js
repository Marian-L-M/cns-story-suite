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
 * • The start (root) node is unnumbered.
 * • Each direct child of root starts a new top-level path: child 1 → [1,1], child 2 → [2,1] …
 * • Linear continuation (parent has exactly 1 outgoing edge):
 *     – if the parent's number was assigned via branching (fromBranch=true): append 1   → [1,2,1] → [1,2,1,1]
 *     – otherwise increment the last segment                               → [1,1] → [1,2] → [1,3]
 * • Branching (parent has ≥2 outgoing edges): each child i → [...parent, i+1], fromBranch=true
 */
function buildTree(nodes, edges, startNodeId) {
  const result = [];
  const visited = new Set();
  const reachable = new Set();
  const stepNums = new Map();
  const fromBranchOf = new Map();

  // Flood-fill reachability from start
  function markReachable(id) {
    if (reachable.has(id)) return;
    reachable.add(id);
    for (const e of edges) {
      if (e.fromNodeId === id) markReachable(e.toNodeId);
    }
  }
  const startId = startNodeId ?? nodes[0]?.id ?? null;
  if (startId !== null) markReachable(startId);
  function assignChildNumbers(nodeId, parentNum, fromBranch, isRoot) {
    const out = edges.filter(e => e.fromNodeId === nodeId).sort((a, b) => a.sortOrder - b.sortOrder);
    if (isRoot) {
      // Root's children each start a new path [pathIndex, 1]
      out.forEach((edge, i) => {
        if (reachable.has(edge.toNodeId) && !stepNums.has(edge.toNodeId)) {
          stepNums.set(edge.toNodeId, [i + 1, 1]);
          fromBranchOf.set(edge.toNodeId, false);
        }
      });
    } else if (parentNum !== null) {
      if (out.length === 1) {
        const childId = out[0].toNodeId;
        if (reachable.has(childId) && !stepNums.has(childId)) {
          const childNum = fromBranch ? [...parentNum, 1] : [...parentNum.slice(0, -1), parentNum[parentNum.length - 1] + 1];
          stepNums.set(childId, childNum);
          fromBranchOf.set(childId, false);
        }
      } else if (out.length > 1) {
        out.forEach((edge, i) => {
          if (reachable.has(edge.toNodeId) && !stepNums.has(edge.toNodeId)) {
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
    const stepNumber = !isRoot && reachable.has(nodeId) ? stepNums.get(nodeId) ?? null : null;
    result.push({
      node,
      incomingEdge,
      siblings,
      depth,
      stepNumber
    });
    const outEdges = edges.filter(e => e.fromNodeId === nodeId).sort((a, b) => a.sortOrder - b.sortOrder);

    // Assign numbers to direct children before descending
    assignChildNumbers(nodeId, stepNumber, fromBranchOf.get(nodeId) ?? false, isRoot);
    for (const edge of outEdges) {
      visit(edge.toNodeId, edge, outEdges, depth + 1, false);
    }
  }
  if (startId !== null) visit(startId, null, [], 0, true);
  // Orphaned nodes (not reachable from start)
  for (const node of nodes) {
    if (!visited.has(node.id)) visit(node.id, null, [], 0, false);
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
  onStartEdgeFrom
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
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
          className: "cns-node-swatch",
          style: {
            background: node.iconColor,
            borderRadius: node.iconType === 'square' ? 2 : '50%'
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
/* harmony import */ var _panels_LinksPanel__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./panels/LinksPanel */ "./src/admin/app/panels/LinksPanel.tsx");
/* harmony import */ var _forms_NodeModal__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./forms/NodeModal */ "./src/admin/app/forms/NodeModal.tsx");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../utils */ "./src/admin/utils.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__);











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
    viewUrl: d.viewUrl ?? ''
  };
}
function StoryEditorApp() {
  const d = window.cnsStoryEditor || {};
  const storyId = d.storyId || 0;
  const isNew = d.isNew || false;
  const [settings, setSettings] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(buildInitialSettings);
  const [nodes, setNodes] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [edges, setEdges] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [links, setLinks] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [mapData, setMapData] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [mapObjects, setMapObjects] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [mapAreas, setMapAreas] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [activeTab, setActiveTab] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('settings');
  const [selectedNodeId, setSelectedNodeId] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [isEdgeMode, setIsEdgeMode] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
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
  const [loading, setLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(!isNew);

  // ── Initial data load ─────────────────────────────────────────────────────

  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (isNew) return;
    (async () => {
      const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('GET', `/stories/${storyId}/data`);
      const data = await res.json();
      if (res.ok) {
        setSettings(data.story);
        setNodes(data.nodes);
        setEdges(data.edges);
        if (data.mapData) {
          setMapData(data.mapData);
          setMapObjects(data.mapData.objects);
          setMapAreas(data.mapData.areas);
        }
      }
      const linksRes = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('GET', `/stories/${storyId}/links`);
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
      const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('POST', '/stories', {
        story_id: storyId,
        title: settings.title,
        status: settings.status,
        map_id: settings.mapId ?? 0,
        line_color: settings.lineColor,
        line_width: settings.lineWidth,
        line_style: settings.lineStyle,
        line_opacity: settings.lineOpacity,
        start_node_id: settings.startNodeId ?? 0
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
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('GET', `/maps/${mapId}/stories`);
    // Reload full story data to get map render data.
    if (!isNew && storyId) {
      const dataRes = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('GET', `/stories/${storyId}/data`);
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
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('POST', `/stories/${storyId}/nodes`, {
      x,
      y,
      substory_id: formData.substoryId ?? 0,
      title_override: formData.titleOverride || null,
      excerpt_override: formData.excerptOverride || null,
      icon_type: formData.iconType,
      icon_id: formData.iconId ?? 0,
      icon_color: formData.iconColor,
      icon_size: formData.iconSize
    });
    if (res.ok) {
      const node = await res.json();
      setNodes(p => [...p, node]);
      return node;
    }
  }
  async function handleNodeUpdate(nodeId, formData) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('PATCH', `/nodes/${nodeId}`, {
      x: formData.x,
      y: formData.y,
      substory_id: formData.substoryId ?? 0,
      title_override: formData.titleOverride || null,
      excerpt_override: formData.excerptOverride || null,
      icon_type: formData.iconType,
      icon_id: formData.iconId ?? 0,
      icon_color: formData.iconColor,
      icon_size: formData.iconSize
    });
    if (res.ok) {
      const updated = await res.json();
      setNodes(p => p.map(n => n.id === nodeId ? updated : n));
    }
  }
  async function handleNodeDelete(nodeId) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('DELETE', `/nodes/${nodeId}`);
    if (res.ok) {
      setNodes(p => p.filter(n => n.id !== nodeId));
      setEdges(p => p.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    }
  }
  async function handleNodeDragEnd(nodeId, x, y) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('PATCH', `/nodes/${nodeId}`, {
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
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('POST', '/edges', {
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
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('DELETE', `/edges/${edgeId}`);
    if (res.ok) {
      setEdges(p => p.filter(e => e.id !== edgeId));
    }
  }

  // ── Link operations ───────────────────────────────────────────────────────

  async function handleLinkAdd(linkType, linkId) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('POST', `/stories/${storyId}/links`, {
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
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('DELETE', `/links/${linkId}`);
    if (res.ok) setLinks(p => p.filter(l => l.id !== linkId));
  }

  // ── Edge reorder ─────────────────────────────────────────────────────────

  async function handleEdgeReorder(edgeId, sortOrder) {
    const res = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('PATCH', `/edges/${edgeId}`, {
      sort_order: sortOrder
    });
    if (res.ok) {
      const updated = await res.json();
      setEdges(p => p.map(e => e.id === edgeId ? updated : e));
    }
  }

  // ── Edge mode key handler ─────────────────────────────────────────────────

  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!isEdgeMode) return;
    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        setIsEdgeMode(false);
        setEdgeStartNodeId(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isEdgeMode]);

  // ── Canvas interaction ────────────────────────────────────────────────────

  function enterEdgeMode() {
    if (selectedNodeId === null) return;
    setEdgeStartNodeId(selectedNodeId);
    setIsEdgeMode(true);
  }
  function exitEdgeMode() {
    setIsEdgeMode(false);
    setEdgeStartNodeId(null);
  }
  function handleNodeClick(nodeId) {
    if (isEdgeMode) {
      if (edgeStartNodeId === null || edgeStartNodeId === nodeId) {
        // Clicked the current base node — end the chain.
        exitEdgeMode();
      } else {
        // Create connection and advance the chain to the new node.
        handleEdgeCreate(edgeStartNodeId, nodeId);
        setEdgeStartNodeId(nodeId);
        setSelectedNodeId(nodeId);
      }
    } else {
      // Select the node; editing is done via the sidebar Edit button.
      setSelectedNodeId(nodeId);
    }
  }
  function handleCanvasClick(x, y) {
    if (isEdgeMode) {
      setEdgeStartNodeId(null);
      setIsEdgeMode(false);
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
    if (selectedNodeId !== null) {
      handleNodeDragEnd(selectedNodeId, x, y);
      setSelectedNodeId(null);
      return;
    }
    setNodeModal({
      open: true,
      nodeId: null,
      x,
      y
    });
  }
  function handleEdgeClick(edgeId) {
    if (window.confirm('Delete this connection?')) {
      handleEdgeDelete(edgeId);
    }
  }
  function handleStartEdgeFrom(fromNodeId) {
    setSelectedNodeId(fromNodeId);
    setEdgeStartNodeId(fromNodeId);
    setIsEdgeMode(true);
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
      exitEdgeMode();
      setSelectedNodeId(null);
    }
    setActiveTab(tab);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const pageTitle = isNew ? 'New Story' : `Edit: ${settings.title || '(no title)'}`;
  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
      className: "cns-story-editor",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
        className: "cns-loading",
        children: "Loading\u2026"
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
    className: "cns-story-editor cns-map-editor",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_EditorHeader__WEBPACK_IMPORTED_MODULE_1__["default"], {
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
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
      className: "cns-editor-main",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        className: "cns-map-editor__body",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_TabBar__WEBPACK_IMPORTED_MODULE_2__["default"], {
          activeTab: activeTab,
          onChange: handleTabChange
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
          className: "cns-map-editor__content",
          children: [activeTab === 'settings' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_panels_SettingsPanel__WEBPACK_IMPORTED_MODULE_5__["default"], {
            settings: settings,
            onChange: setSettings,
            onMapChange: handleMapChange
          }), activeTab === 'canvas' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
            className: "cns-story-canvas-view",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
              className: "cns-story-canvas-toolbar",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
                className: "cns-story-canvas-toolbar__row",
                children: [!isEdgeMode && !isNew && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("button", {
                  className: "button",
                  onClick: enterEdgeMode,
                  disabled: selectedNodeId === null,
                  title: selectedNodeId === null ? 'Select a node first to connect from' : 'Start building a path from the selected node',
                  children: "\u27F6 Connect Nodes"
                }), isEdgeMode && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("button", {
                  className: "button button-primary",
                  onClick: exitEdgeMode,
                  children: "\u2713 Save Path"
                }), isEdgeMode && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
                  className: "cns-story-canvas-toolbar__hint",
                  children: "Click nodes to chain a path \xB7 Enter or Esc to finish"
                }), !isEdgeMode && !isNew && selectedNodeId !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
                  className: "cns-story-canvas-toolbar__hint",
                  children: "Click canvas to move here \xB7 Connect Nodes to start a path"
                }), !isEdgeMode && !isNew && selectedNodeId === null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
                  className: "cns-story-canvas-toolbar__hint",
                  children: "Click a node to select \xB7 Click empty space to add \xB7 Drag to move"
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
                className: "cns-story-canvas-toolbar__row cns-story-canvas-toolbar__line-style",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
                  className: "cns-story-canvas-toolbar__label",
                  children: "Lines:"
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("label", {
                  children: ["Color", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("input", {
                    type: "color",
                    value: settings.lineColor,
                    onChange: e => setSettings(p => ({
                      ...p,
                      lineColor: e.target.value
                    }))
                  })]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("label", {
                  children: ["Width", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("input", {
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
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("label", {
                  children: ["Style", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("select", {
                    value: settings.lineStyle,
                    onChange: e => setSettings(p => ({
                      ...p,
                      lineStyle: e.target.value
                    })),
                    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("option", {
                      value: "solid",
                      children: "Solid"
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("option", {
                      value: "dashed",
                      children: "Dashed"
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("option", {
                      value: "dotted",
                      children: "Dotted"
                    })]
                  })]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("label", {
                  children: ["Opacity", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("input", {
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
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
              className: "cns-story-canvas-layout",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
                className: "cns-story-canvas-main",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
                  className: "cns-story-canvas-wrap",
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_canvas_StoryCanvas__WEBPACK_IMPORTED_MODULE_3__["default"], {
                    mapData: mapData,
                    mapObjects: mapObjects,
                    mapAreas: mapAreas,
                    nodes: nodes,
                    edges: edges,
                    selectedNodeId: selectedNodeId,
                    edgeStartNodeId: edgeStartNodeId,
                    isEdgeMode: isEdgeMode,
                    lineColor: settings.lineColor,
                    lineWidth: settings.lineWidth,
                    lineStyle: settings.lineStyle,
                    lineOpacity: settings.lineOpacity,
                    onNodeClick: handleNodeClick,
                    onCanvasClick: handleCanvasClick,
                    onEdgeClick: handleEdgeClick,
                    onNodeDragEnd: handleNodeDragEnd
                  })
                })
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
                className: "cns-story-window-panel",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_CanvasNodeList__WEBPACK_IMPORTED_MODULE_4__["default"], {
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
                  onStartEdgeFrom: handleStartEdgeFrom
                })
              })]
            })]
          }), activeTab === 'nodes' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_panels_NodesPanel__WEBPACK_IMPORTED_MODULE_6__["default"], {
            nodes: nodes,
            edges: edges,
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
            onEdgeDelete: handleEdgeDelete
          }), activeTab === 'links' && !isNew && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_panels_LinksPanel__WEBPACK_IMPORTED_MODULE_7__["default"], {
            storyId: storyId,
            links: links,
            onLinkAdd: handleLinkAdd,
            onLinkDelete: handleLinkDelete
          }), activeTab === 'links' && isNew && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
            className: "cns-panel-notice",
            children: "Save the story first to manage links."
          })]
        })]
      })
    }), nodeModal.open && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_forms_NodeModal__WEBPACK_IMPORTED_MODULE_8__["default"], {
      nodeId: nodeModal.nodeId,
      existingNode: selectedNode,
      initialX: nodeModal.x,
      initialY: nodeModal.y,
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
    })]
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
    substoryId: node?.substoryId ?? null,
    substoryLabel: node?.substoryTitle ?? '',
    titleOverride: node?.titleOverride ?? '',
    excerptOverride: node?.excerptOverride ?? '',
    iconType: node?.iconType ?? 'round',
    iconId: node?.iconId ?? null,
    iconColor: node?.iconColor ?? '#ffffff',
    iconSize: node?.iconSize ?? 1.0
  };
}
function NodeModal({
  nodeId,
  existingNode,
  initialX,
  initialY,
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
                children: ['round', 'square', 'icon'].map(t => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("label", {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                    type: "radio",
                    name: "icon-type",
                    value: t,
                    checked: form.iconType === t,
                    onChange: () => set('iconType', t)
                  }), ' ', t.charAt(0).toUpperCase() + t.slice(1)]
                }, t))
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
                    const frame = window.wp?.media({
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
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "cns-form-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("label", {
                children: "Color"
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
  startNodeId,
  onEditNode,
  onDeleteNode,
  onSetStartNode,
  onEdgeReorder,
  onEdgeDelete
}) {
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
                  background: node.iconColor,
                  width: 18,
                  height: 18,
                  display: 'inline-block',
                  borderRadius: node.iconType === 'square' ? 2 : '50%',
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
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
    className: "cns-panel cns-settings-panel",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("h2", {
      children: "Story Settings"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("table", {
      className: "form-table",
      role: "presentation",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("tbody", {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("th", {
            scope: "row",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("label", {
              htmlFor: "story-title",
              children: "Title"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("td", {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("input", {
              id: "story-title",
              type: "text",
              className: "regular-text",
              value: settings.title,
              onChange: e => set('title', e.target.value)
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("th", {
            scope: "row",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("label", {
              children: "Map"
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("td", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_shared_MapPicker__WEBPACK_IMPORTED_MODULE_0__["default"], {
              mapId: settings.mapId,
              mapTitle: settings.mapTitle,
              onChange: onMapChange
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("p", {
              className: "description",
              children: "The story canvas overlays this map. Objects and areas are shown read-only."
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
  selectedNodeId,
  edgeStartNodeId,
  isEdgeMode,
  lineColor,
  lineWidth,
  lineStyle,
  lineOpacity,
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
    selectedNodeId,
    edgeStartNodeId,
    isEdgeMode,
    lineColor,
    lineWidth,
    lineStyle,
    lineOpacity
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
      selectedNodeId,
      edgeStartNodeId,
      isEdgeMode,
      lineColor,
      lineWidth,
      lineStyle,
      lineOpacity
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
    });
    (0,_canvas__WEBPACK_IMPORTED_MODULE_1__.preloadImages)(urls);
  }, [mapData, mapObjects, nodes]);

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
  ctx.save();
  ctx.strokeStyle = state.lineColor;
  ctx.lineWidth = state.lineWidth;
  ctx.globalAlpha = state.lineOpacity;
  if (state.lineStyle === 'dashed') {
    ctx.setLineDash([10, 5]);
  } else if (state.lineStyle === 'dotted') {
    ctx.setLineDash([2, 5]);
  } else {
    ctx.setLineDash([]);
  }
  for (const edge of state.edges) {
    const from = nodeMap.get(edge.fromNodeId);
    const to = nodeMap.get(edge.toNodeId);
    if (!from || !to) continue;
    const fx = from.x * W;
    const fy = from.y * H;
    const tx = to.x * W;
    const ty = to.y * H;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    drawArrowhead(ctx, fx, fy, tx, ty, state.lineWidth, state.lineColor, state.lineOpacity);
  }
  ctx.restore();
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
    drawNode(ctx, cx, cy, node, isSelected, isEdgeSrc);
  }
}
function drawNode(ctx, cx, cy, node, isSelected, isEdgeSrc) {
  const r = NODE_BASE_RADIUS * node.iconSize;
  if (isSelected || isEdgeSrc) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = isEdgeSrc ? '#ffcc00' : '#00aaff';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.restore();
  }
  if (node.iconType === 'icon' && node.iconUrl) {
    const img = loadImage(node.iconUrl);
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      return;
    }
  }
  if (node.iconType === 'square') {
    ctx.save();
    ctx.fillStyle = node.iconColor;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = node.iconColor;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
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