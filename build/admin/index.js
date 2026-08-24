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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-down.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-up.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/brush.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/link-off.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/pencil.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/plus-circle.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/star-filled.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/trash.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__);




// Matches the server's ORDER BY sort_order ASC, id ASC — fresh edges all
// default to sort_order 0, so the id tiebreak keeps the order deterministic.
function byOrder(a, b) {
  return a.sortOrder - b.sortOrder || a.id - b.id;
}
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
      const out = edges.filter(e => e.fromNodeId === nodeId && reachable.has(e.toNodeId)).sort(byOrder);
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
      const outEdges = edges.filter(e => e.fromNodeId === nodeId && reachable.has(e.toNodeId)).sort(byOrder);
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
  onEditEdge,
  onSequenceSwap
}) {
  if (!nodes.length) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
      className: "cns-canvas-node-list cns-canvas-node-list--empty",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("p", {
        className: "description",
        children: "Click on the canvas to add your first node."
      })
    });
  }
  const tree = buildTree(nodes, edges, startNodeId);

  // Swaps two adjacent siblings, then rewrites every sibling's sort order to
  // its list index — fresh edges all default to 0, so swapping the stored
  // values alone would be a no-op.
  function reorderSiblings(sorted, idx, dir) {
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    reordered.forEach((edge, i) => {
      if (edge.sortOrder !== i) onEdgeReorder(edge.id, i);
    });
  }

  // Branch nodes (≥2 siblings) reorder among their siblings; linear nodes
  // swap places with their neighbour in the chain, rewiring connections.
  function handleMoveUp(item) {
    const {
      incomingEdge,
      siblings
    } = item;
    if (!incomingEdge) return;
    const sorted = [...siblings].sort(byOrder);
    if (sorted.length > 1) {
      reorderSiblings(sorted, sorted.findIndex(e => e.id === incomingEdge.id), -1);
    } else {
      onSequenceSwap(incomingEdge); // swap with the parent node
    }
  }
  function handleMoveDown(item) {
    const {
      incomingEdge,
      siblings
    } = item;
    if (!incomingEdge) return;
    const sorted = [...siblings].sort(byOrder);
    if (sorted.length > 1) {
      reorderSiblings(sorted, sorted.findIndex(e => e.id === incomingEdge.id), 1);
    } else {
      const out = edges.filter(e => e.fromNodeId === item.node.id).sort(byOrder);
      if (out.length !== 1) return;
      onSequenceSwap(out[0]); // swap with the single successor node
    }
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
    className: "cns-canvas-node-list",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
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
      const sorted = [...siblings].sort(byOrder);
      const idx = sorted.findIndex(e => e.id === incomingEdge?.id);
      const isBranch = sorted.length > 1;
      const outCount = incomingEdge ? edges.filter(e => e.fromNodeId === node.id).length : 0;
      // Branch: reorder among siblings. Linear: swap with the parent
      // (up) or the single successor (down).
      const canUp = incomingEdge !== null && (!isBranch || idx > 0);
      const canDown = incomingEdge !== null && (isBranch ? idx < sorted.length - 1 : outCount === 1);
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        className: ['cns-canvas-node-list__item', isSelected ? 'is-selected' : '', isOrphan ? 'is-orphan' : ''].filter(Boolean).join(' '),
        style: {
          paddingLeft: 8 + Math.min(depth, 4) * 14
        },
        children: [incomingEdge && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
          className: "cns-canvas-node-list__connector",
          children: "\u2514"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
          className: "cns-canvas-node-list__step",
          children: isStart ? '★' : formatStep(stepNumber)
        }), node.iconType === 'thumbnail' && node.substoryThumbnailUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("img", {
          src: node.substoryThumbnailUrl,
          alt: "",
          className: "cns-node-swatch",
          style: {
            borderRadius: '50%',
            objectFit: 'cover'
          }
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
          className: "cns-node-swatch",
          style: {
            background: node.iconColor,
            borderRadius: node.iconType === 'square' ? 2 : node.iconType === 'diamond' ? 0 : '50%',
            transform: node.iconType === 'diamond' ? 'rotate(45deg)' : undefined
          }
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("button", {
          className: "cns-canvas-node-list__title",
          onClick: () => onSelect(node.id),
          title: "Select on canvas",
          children: getDisplayTitle(node)
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
          className: "cns-canvas-node-list__actions",
          children: [incomingEdge && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.Fragment, {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
              size: "small",
              icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_9__.__)('Move up in sequence', 'cns-story-suite'),
              disabled: !canUp,
              onClick: () => handleMoveUp(item)
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
              size: "small",
              icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__["default"],
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_9__.__)('Move down in sequence', 'cns-story-suite'),
              disabled: !canDown,
              onClick: () => handleMoveDown(item)
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
              size: "small",
              icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"],
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_9__.__)('Style this connection', 'cns-story-suite'),
              onClick: () => onEditEdge(incomingEdge.id)
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
              size: "small",
              icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__["default"],
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_9__.__)('Remove this branch', 'cns-story-suite'),
              onClick: () => {
                if (window.confirm('Remove the connection to this node?')) {
                  onEdgeDelete(incomingEdge.id);
                }
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
              size: "small",
              icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_6__["default"],
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_9__.__)('Split route: add a parallel branch from the same parent', 'cns-story-suite'),
              onClick: () => onStartEdgeFrom(incomingEdge.fromNodeId)
            })]
          }), !incomingEdge && !isStart && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
            size: "small",
            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_7__["default"],
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_9__.__)('Set as start node', 'cns-story-suite'),
            onClick: () => onSetStartNode(node.id)
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
            size: "small",
            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__["default"],
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_9__.__)('Edit node', 'cns-story-suite'),
            onClick: () => onEdit(node.id)
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
            size: "small",
            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_8__["default"],
            isDestructive: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_9__.__)('Delete node', 'cns-story-suite'),
            onClick: () => {
              if (window.confirm('Delete this node and all its connections?')) {
                onDelete(node.id);
              }
            }
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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-left.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/external.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);




const STATUS_OPTIONS = [{
  value: 'draft',
  label: 'Draft'
}, {
  value: 'publish',
  label: 'Published'
}, {
  value: 'private',
  label: 'Private'
}];
function EditorHeader({
  pageTitle,
  overviewUrl,
  viewUrl,
  status,
  isSaving,
  onStatusChange,
  onSave
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "cns-map-editor__header",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
      href: overviewUrl,
      variant: "tertiary",
      icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__["default"],
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('All Stories', 'cns-story-suite')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("h1", {
      children: pageTitle
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "cns-map-editor__header-actions",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.SelectControl, {
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Post status', 'cns-story-suite'),
        hideLabelFromVision: true,
        value: status,
        options: STATUS_OPTIONS,
        onChange: v => onStatusChange(v)
      }), viewUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
        href: viewUrl,
        variant: "secondary",
        icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
        target: "_blank",
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('View Story', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
        variant: "primary",
        isBusy: isSaving,
        disabled: isSaving,
        onClick: onSave,
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Save Story', 'cns-story-suite')
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
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/notices */ "@wordpress/notices");
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_notices__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _EditorHeader__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./EditorHeader */ "./src/admin/app/EditorHeader.tsx");
/* harmony import */ var _TabBar__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./TabBar */ "./src/admin/app/TabBar.tsx");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils */ "./src/admin/utils.ts");
/* harmony import */ var _forms_EdgeStyleModal__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./forms/EdgeStyleModal */ "./src/admin/app/forms/EdgeStyleModal.tsx");
/* harmony import */ var _forms_NodeModal__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./forms/NodeModal */ "./src/admin/app/forms/NodeModal.tsx");
/* harmony import */ var _panels_LinksPanel__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./panels/LinksPanel */ "./src/admin/app/panels/LinksPanel.tsx");
/* harmony import */ var _panels_NodesPanel__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./panels/NodesPanel */ "./src/admin/app/panels/NodesPanel.tsx");
/* harmony import */ var _panels_PathsPanel__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./panels/PathsPanel */ "./src/admin/app/panels/PathsPanel.tsx");
/* harmony import */ var _panels_SettingsPanel__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./panels/SettingsPanel */ "./src/admin/app/panels/SettingsPanel.tsx");
/* harmony import */ var _panels_StoryCanvasPanel__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./panels/StoryCanvasPanel */ "./src/admin/app/panels/StoryCanvasPanel.tsx");
/* harmony import */ var _shared_Notices__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./shared/Notices */ "./src/admin/app/shared/Notices.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__);
















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
  const [isSaving, setIsSaving] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
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
  const {
    createSuccessNotice,
    createErrorNotice
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useDispatch)(_wordpress_notices__WEBPACK_IMPORTED_MODULE_2__.store);

  // ── Initial data load ─────────────────────────────────────────────────────

  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (isNew) return;
    (async () => {
      try {
        const data = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('GET', `/stories/${storyId}/data`);
        setSettings(data.story);
        setNodes(data.nodes);
        setEdges(data.edges);
        setPaths(data.paths ?? []);
        if (data.mapData) {
          setMapData(data.mapData);
          setMapObjects(data.mapData.objects);
          setMapAreas(data.mapData.areas);
        }
      } catch {
        /* load failures leave the editor empty, as before */
      }
      try {
        setLinks(await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('GET', `/stories/${storyId}/links`));
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, []);

  // ── Save story settings ───────────────────────────────────────────────────

  async function handleSave() {
    setIsSaving(true);
    try {
      const data = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('POST', '/stories', {
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
      if (data.created && data.editUrl) {
        window.location.href = data.editUrl;
      } else {
        if (data.viewUrl !== undefined) {
          setSettings(p => ({
            ...p,
            viewUrl: data.viewUrl
          }));
        }
        createSuccessNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Story saved.', 'cns-story-suite'), {
          type: 'snackbar'
        });
      }
    } catch (err) {
      createErrorNotice(err.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Save failed.', 'cns-story-suite'), {
        type: 'snackbar'
      });
    } finally {
      setIsSaving(false);
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
    // Reload full story data to get map render data.
    if (!isNew && storyId) {
      try {
        const data = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('GET', `/stories/${storyId}/data`);
        if (data.mapData) {
          setMapData(data.mapData);
          setMapObjects(data.mapData.objects);
          setMapAreas(data.mapData.areas);
        }
      } catch {
        /* ignore — canvas keeps the previous base map */
      }
    }
  }

  // ── Node operations ───────────────────────────────────────────────────────

  async function handleNodeCreate(formData, x, y) {
    try {
      const node = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('POST', `/stories/${storyId}/nodes`, {
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
      setNodes(p => [...p, node]);
      return node;
    } catch {
      /* create failures are silent, as before */
    }
  }
  async function handleNodeUpdate(nodeId, formData) {
    try {
      const updated = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('PATCH', `/nodes/${nodeId}`, {
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
      setNodes(p => p.map(n => n.id === nodeId ? updated : n));
    } catch {
      /* update failures are silent, as before */
    }
  }
  async function handleNodeDelete(nodeId) {
    try {
      await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('DELETE', `/nodes/${nodeId}`);
      setNodes(p => p.filter(n => n.id !== nodeId));
      setEdges(p => p.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    } catch {
      /* delete failures are silent, as before */
    }
  }
  async function handleNodeDragEnd(nodeId, x, y) {
    try {
      const updated = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('PATCH', `/nodes/${nodeId}`, {
        x,
        y
      });
      setNodes(p => p.map(n => n.id === nodeId ? updated : n));
    } catch {
      /* position patches fail silently, as before */
    }
  }

  // ── Edge operations ───────────────────────────────────────────────────────

  async function handleEdgeCreate(fromId, toId) {
    try {
      const edge = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('POST', '/edges', {
        story_id: storyId,
        from_node_id: fromId,
        to_node_id: toId
      });
      setEdges(p => {
        // Replace if a duplicate edge is returned.
        const filtered = p.filter(e => e.id !== edge.id);
        return [...filtered, edge];
      });
    } catch {
      /* create failures are silent, as before */
    }
  }
  async function handleEdgeDelete(edgeId) {
    try {
      await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('DELETE', `/edges/${edgeId}`);
      setEdges(p => p.filter(e => e.id !== edgeId));
    } catch {
      /* delete failures are silent, as before */
    }
  }
  async function handleEdgeUpdate(edgeId, formData) {
    try {
      const updated = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('PATCH', `/edges/${edgeId}`, {
        line_color: formData.lineColor,
        line_width: formData.lineWidth,
        line_style: formData.lineStyle,
        line_opacity: formData.lineOpacity
      });
      setEdges(p => p.map(e => e.id === edgeId ? updated : e));
    } catch {
      /* update failures are silent, as before */
    }
  }

  // ── Path operations ───────────────────────────────────────────────────────

  async function handlePathCreate(data) {
    try {
      const path = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('POST', `/stories/${storyId}/paths`, {
        label: data.label,
        marker_color: data.markerColor,
        marker_size: data.markerSize,
        marker_type: data.markerType,
        marker_icon_id: data.markerIconId ?? 0,
        marker_icon_offset_x: data.markerIconOffsetX,
        marker_icon_offset_y: data.markerIconOffsetY
      });
      setPaths(p => [...p, path]);
    } catch {
      /* create failures are silent, as before */
    }
  }
  async function handlePathUpdate(pathId, data) {
    try {
      const updated = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('PATCH', `/paths/${pathId}`, {
        label: data.label,
        marker_color: data.markerColor,
        marker_size: data.markerSize,
        marker_type: data.markerType,
        marker_icon_id: data.markerIconId ?? 0,
        marker_icon_offset_x: data.markerIconOffsetX,
        marker_icon_offset_y: data.markerIconOffsetY
      });
      setPaths(p => p.map(path => path.id === pathId ? updated : path));
    } catch {
      /* update failures are silent, as before */
    }
  }
  async function handlePathDelete(pathId) {
    try {
      await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('DELETE', `/paths/${pathId}`);
      setPaths(p => p.filter(path => path.id !== pathId));
      // Clear pathId on nodes that belonged to this path.
      setNodes(ns => ns.map(n => n.pathId === pathId ? {
        ...n,
        pathId: null
      } : n));
    } catch {
      /* delete failures are silent, as before */
    }
  }

  // ── Path node manager (Paths tab modal) ───────────────────────────────────

  /** Minimal node create for the path modal: substory at canvas centre, already in the path. */
  async function handleQuickNodeCreate(substoryId, pathId) {
    try {
      const node = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('POST', `/stories/${storyId}/nodes`, {
        x: 0.5,
        y: 0.5,
        path_id: pathId,
        substory_id: substoryId
      });
      setNodes(p => [...p, node]);
      return node;
    } catch {
      return undefined;
    }
  }

  /**
   * Applies the modal's result: path membership, then a linear connection
   * chain in list order. Connections between the affected nodes that aren't
   * part of the new chain are removed; connections to outside nodes stay.
   */
  async function handlePathNodesApply(pathId, orderedIds, removedIds) {
    try {
      for (const id of removedIds) {
        const updated = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('PATCH', `/nodes/${id}`, {
          path_id: 0
        });
        setNodes(p => p.map(n => n.id === id ? updated : n));
      }
      for (const id of orderedIds) {
        const node = nodes.find(n => n.id === id);
        if (node && node.pathId !== pathId) {
          const updated = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('PATCH', `/nodes/${id}`, {
            path_id: pathId
          });
          setNodes(p => p.map(n => n.id === id ? updated : n));
        }
      }
      const affected = new Set([...orderedIds, ...removedIds]);
      const desired = new Set();
      for (let i = 0; i < orderedIds.length - 1; i++) {
        desired.add(`${orderedIds[i]}-${orderedIds[i + 1]}`);
      }
      for (const edge of edges) {
        const key = `${edge.fromNodeId}-${edge.toNodeId}`;
        if (affected.has(edge.fromNodeId) && affected.has(edge.toNodeId) && !desired.has(key)) {
          await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('DELETE', `/edges/${edge.id}`);
          setEdges(p => p.filter(e => e.id !== edge.id));
        }
      }
      const existing = new Set(edges.map(e => `${e.fromNodeId}-${e.toNodeId}`));
      for (const key of desired) {
        if (existing.has(key)) continue;
        const [from, to] = key.split('-').map(Number);
        const edge = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('POST', '/edges', {
          story_id: storyId,
          from_node_id: from,
          to_node_id: to
        });
        setEdges(p => {
          const filtered = p.filter(e => e.id !== edge.id);
          return [...filtered, edge];
        });
      }
      createSuccessNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Path nodes updated.', 'cns-story-suite'), {
        type: 'snackbar'
      });
    } catch (err) {
      createErrorNotice(err.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Updating path nodes failed.', 'cns-story-suite'), {
        type: 'snackbar'
      });
    }
  }

  // ── Link operations ───────────────────────────────────────────────────────

  async function handleLinkAdd(linkType, linkId) {
    try {
      const storyLink = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('POST', `/stories/${storyId}/links`, {
        link_type: linkType,
        link_id: linkId
      });
      setLinks(p => {
        const filtered = p.filter(l => l.id !== storyLink.id);
        return [...filtered, storyLink];
      });
    } catch {
      /* create failures are silent, as before */
    }
  }
  async function handleLinkDelete(linkId) {
    try {
      await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('DELETE', `/links/${linkId}`);
      setLinks(p => p.filter(l => l.id !== linkId));
    } catch {
      /* delete failures are silent, as before */
    }
  }

  // ── Edge reorder ─────────────────────────────────────────────────────────

  async function handleEdgeReorder(edgeId, sortOrder) {
    try {
      const updated = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('PATCH', `/edges/${edgeId}`, {
        sort_order: sortOrder
      });
      setEdges(p => p.map(e => e.id === edgeId ? updated : e));
    } catch {
      /* reorder failures are silent, as before */
    }
  }

  // ── Node sequence swap ───────────────────────────────────────────────────

  /**
   * Swaps the two nodes joined by `pivot` in the story sequence: the pivot
   * edge reverses, and every other connection touching either node trades
   * that endpoint for the other node. Node positions on the canvas stay put —
   * only the connections are rewired. If the earlier node was the start node,
   * the start flag moves to the node taking its place.
   */
  async function handleSequenceSwap(pivot) {
    const n = pivot.fromNodeId;
    const m = pivot.toNodeId;

    // Reverse the pivot first so the earlier node has no outgoing edge left
    // when its replacement inherits the successor connections.
    const changes = [{
      id: pivot.id,
      from: m,
      to: n
    }];
    for (const e of edges) {
      if (e.id === pivot.id) continue;
      const from = e.fromNodeId === n ? m : e.fromNodeId === m ? n : e.fromNodeId;
      const to = e.toNodeId === n ? m : e.toNodeId === m ? n : e.toNodeId;
      if (from !== e.fromNodeId || to !== e.toNodeId) {
        changes.push({
          id: e.id,
          from,
          to
        });
      }
    }
    try {
      for (const c of changes) {
        const updated = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('PATCH', `/edges/${c.id}`, {
          from_node_id: c.from,
          to_node_id: c.to
        });
        setEdges(p => p.map(e => e.id === c.id ? updated : e));
      }
      if (settings.startNodeId === n) {
        setSettings(p => ({
          ...p,
          startNodeId: m
        }));
      }
    } catch (err) {
      createErrorNotice(err.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Reordering failed.', 'cns-story-suite'), {
        type: 'snackbar'
      });
      // A partial rewire leaves the local graph stale — resync from the server.
      try {
        const data = await (0,_utils__WEBPACK_IMPORTED_MODULE_6__.apiFetch)('GET', `/stories/${storyId}/data`);
        setEdges(data.edges);
      } catch {
        /* keep local state if the resync fails too */
      }
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
      createErrorNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Save the story first before adding nodes.', 'cns-story-suite'), {
        type: 'snackbar'
      });
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
  function handleCanvasModeChange(mode) {
    setEdgeStartNodeId(mode === 'connect' ? selectedNodeId : null);
    setCanvasMode(mode);
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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)("div", {
      className: "cns-story-editor",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)("div", {
        className: "cns-loading",
        children: "Loading\u2026"
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)("div", {
    className: "cns-story-editor cns-map-editor",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_EditorHeader__WEBPACK_IMPORTED_MODULE_4__["default"], {
      pageTitle: pageTitle,
      overviewUrl: d.overviewUrl || '#',
      viewUrl: !isNew ? settings.viewUrl : '',
      status: settings.status,
      isSaving: isSaving,
      onStatusChange: s => setSettings(p => ({
        ...p,
        status: s
      })),
      onSave: handleSave
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)("div", {
      className: "cns-map-editor__main",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)("div", {
        className: "cns-map-editor__body",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_TabBar__WEBPACK_IMPORTED_MODULE_5__["default"], {
          activeTab: activeTab,
          onChange: handleTabChange
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsxs)("div", {
          className: "cns-map-editor__content",
          children: [activeTab === 'settings' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_panels_SettingsPanel__WEBPACK_IMPORTED_MODULE_12__["default"], {
            settings: settings,
            onChange: setSettings,
            onMapChange: handleMapChange
          }), activeTab === 'canvas' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_panels_StoryCanvasPanel__WEBPACK_IMPORTED_MODULE_13__["default"], {
            isNew: isNew,
            settings: settings,
            nodes: nodes,
            edges: edges,
            paths: paths,
            mapData: mapData,
            mapObjects: mapObjects,
            mapAreas: mapAreas,
            canvasMode: canvasMode,
            selectedNodeId: selectedNodeId,
            edgeStartNodeId: edgeStartNodeId,
            onSettingsChange: setSettings,
            onCanvasModeChange: handleCanvasModeChange,
            onNodeClick: handleNodeClick,
            onCanvasClick: handleCanvasClick,
            onEdgeClick: handleEdgeClick,
            onNodeDragEnd: handleNodeDragEnd,
            onSelectNode: setSelectedNodeId,
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
            onStartEdgeFrom: handleStartEdgeFrom,
            onEditEdge: edgeId => setEdgeModal({
              open: true,
              edgeId
            }),
            onSequenceSwap: handleSequenceSwap
          }), activeTab === 'nodes' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_panels_NodesPanel__WEBPACK_IMPORTED_MODULE_10__["default"], {
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
          }), activeTab === 'paths' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_panels_PathsPanel__WEBPACK_IMPORTED_MODULE_11__["default"], {
            paths: paths,
            nodes: nodes,
            edges: edges,
            onCreatePath: handlePathCreate,
            onUpdatePath: handlePathUpdate,
            onDeletePath: handlePathDelete,
            onQuickNodeCreate: handleQuickNodeCreate,
            onPathNodesApply: handlePathNodesApply
          }), activeTab === 'links' && !isNew && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_panels_LinksPanel__WEBPACK_IMPORTED_MODULE_9__["default"], {
            storyId: storyId,
            links: links,
            onLinkAdd: handleLinkAdd,
            onLinkDelete: handleLinkDelete
          }), activeTab === 'links' && isNew && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)("div", {
            className: "cns-panel-notice",
            children: "Save the story first to manage links."
          })]
        })]
      })
    }), nodeModal.open && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_forms_NodeModal__WEBPACK_IMPORTED_MODULE_8__["default"], {
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
      return edge ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_forms_EdgeStyleModal__WEBPACK_IMPORTED_MODULE_7__["default"], {
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
    })(), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)(_shared_Notices__WEBPACK_IMPORTED_MODULE_14__["default"], {})]
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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/trash.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/undo.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _shared_ColorField__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/ColorField */ "./src/admin/app/shared/ColorField.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);






/** Small "back to story default" reset next to an overridden field. */
function ResetOverride({
  visible,
  onReset
}) {
  if (!visible) return null;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
    size: "small",
    icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"],
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Use story default', 'cns-story-suite'),
    onClick: onReset
  });
}
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
  const effectiveColor = form.lineColor ?? storyColor;
  const effectiveWidth = form.lineWidth ?? storyWidth;
  const effectiveStyle = form.lineStyle ?? storyStyle;
  const effectiveOpacity = form.lineOpacity ?? storyOpacity;
  const hasOverride = form.lineColor !== null || form.lineWidth !== null || form.lineStyle !== null || form.lineOpacity !== null;
  const defaultHint = isDefault => isDefault ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('(story default)', 'cns-story-suite') : undefined;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Modal, {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Path Style', 'cns-story-suite'),
    onRequestClose: onClose,
    size: "medium",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("p", {
      className: "description",
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Override this connection’s line style, or use the story’s global settings.', 'cns-story-suite')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
      className: "cns-grid cns-grid__12",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
        className: "cns-grid__group",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Flex, {
          gap: 1,
          align: "flex-end",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
            style: {
              flex: 1
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_shared_ColorField__WEBPACK_IMPORTED_MODULE_5__["default"], {
              label: `${(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Color', 'cns-story-suite')} ${defaultHint(form.lineColor === null) ?? ''}`,
              value: effectiveColor,
              onChange: v => setForm(p => ({
                ...p,
                lineColor: v
              }))
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(ResetOverride, {
            visible: form.lineColor !== null,
            onReset: () => setForm(p => ({
              ...p,
              lineColor: null
            }))
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
        className: "cns-grid__group",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Flex, {
          gap: 1,
          align: "flex-end",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
            style: {
              flex: 1
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
              __next40pxDefaultSize: true,
              label: `${(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Width (px)', 'cns-story-suite')} ${defaultHint(form.lineWidth === null) ?? ''}`,
              min: 0.5,
              max: 20,
              step: 0.5,
              value: effectiveWidth,
              onChange: v => setForm(p => ({
                ...p,
                lineWidth: parseFloat(v ?? '') || storyWidth
              }))
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(ResetOverride, {
            visible: form.lineWidth !== null,
            onReset: () => setForm(p => ({
              ...p,
              lineWidth: null
            }))
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
        className: "cns-grid__group",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Flex, {
          gap: 1,
          align: "flex-end",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
            style: {
              flex: 1
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
              __next40pxDefaultSize: true,
              __nextHasNoMarginBottom: true,
              label: `${(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Style', 'cns-story-suite')} ${defaultHint(form.lineStyle === null) ?? ''}`,
              value: effectiveStyle,
              options: [{
                value: 'solid',
                label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Solid', 'cns-story-suite')
              }, {
                value: 'dashed',
                label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Dashed', 'cns-story-suite')
              }, {
                value: 'dotted',
                label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Dotted', 'cns-story-suite')
              }],
              onChange: v => setForm(p => ({
                ...p,
                lineStyle: v
              }))
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(ResetOverride, {
            visible: form.lineStyle !== null,
            onReset: () => setForm(p => ({
              ...p,
              lineStyle: null
            }))
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
        className: "cns-grid__group",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Flex, {
          gap: 1,
          align: "flex-end",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
            style: {
              flex: 1
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.RangeControl, {
              __next40pxDefaultSize: true,
              __nextHasNoMarginBottom: true,
              label: `${(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Opacity', 'cns-story-suite')} ${defaultHint(form.lineOpacity === null) ?? ''}`,
              min: 0,
              max: 1,
              step: 0.05,
              withInputField: true,
              value: effectiveOpacity,
              onChange: v => setForm(p => ({
                ...p,
                lineOpacity: v ?? storyOpacity
              }))
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(ResetOverride, {
            visible: form.lineOpacity !== null,
            onReset: () => setForm(p => ({
              ...p,
              lineOpacity: null
            }))
          })]
        })
      })]
    }), hasOverride && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
      variant: "secondary",
      icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"],
      style: {
        marginTop: 12
      },
      onClick: () => setForm({
        lineColor: null,
        lineWidth: null,
        lineStyle: null,
        lineOpacity: null
      }),
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Reset all to story defaults', 'cns-story-suite')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Flex, {
      justify: "flex-start",
      gap: 2,
      style: {
        marginTop: 16
      },
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "secondary",
        isDestructive: true,
        icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
        style: {
          marginRight: 'auto'
        },
        onClick: () => {
          if (window.confirm((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Delete this connection?', 'cns-story-suite'))) {
            onDelete(edge.id);
            onClose();
          }
        },
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Delete connection', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "tertiary",
        onClick: onClose,
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Cancel', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "primary",
        onClick: () => {
          onSave(edge.id, form);
          onClose();
        },
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Save', 'cns-story-suite')
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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/image.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/plus.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/trash.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _shared_SubstoryPicker__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../shared/SubstoryPicker */ "./src/admin/app/shared/SubstoryPicker.tsx");
/* harmony import */ var _shared_ColorField__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../shared/ColorField */ "./src/admin/app/shared/ColorField.tsx");
/* harmony import */ var _shared_MediaSelectButton__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../shared/MediaSelectButton */ "./src/admin/app/shared/MediaSelectButton.tsx");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../utils */ "./src/admin/utils.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__);









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
const SHAPE_OPTIONS = [{
  value: 'round',
  label: 'Round'
}, {
  value: 'square',
  label: 'Square'
}, {
  value: 'diamond',
  label: 'Diamond'
}, {
  value: 'icon',
  label: 'Icon'
}, {
  value: 'thumbnail',
  label: 'Thumbnail'
}];
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
      const data = await (0,_utils__WEBPACK_IMPORTED_MODULE_9__.apiFetch)('POST', '/substories', {
        title: newTitle
      });
      set('substoryId', data.id);
      set('substoryLabel', data.title);
      setNewTitle('');
    } catch {
      /* create failures are silent, as before */
    } finally {
      setCreating(false);
    }
  }
  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Modal, {
    title: isNew ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Add Node', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Edit Node', 'cns-story-suite'),
    onRequestClose: onClose,
    size: "medium",
    className: "cns-node-modal",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
      className: "cns-modal-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("h3", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Substory Post', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_shared_SubstoryPicker__WEBPACK_IMPORTED_MODULE_6__["default"], {
        substoryId: form.substoryId,
        substoryLabel: form.substoryLabel,
        onChange: (id, label) => {
          set('substoryId', id);
          set('substoryLabel', label);
        }
      }), !form.substoryId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        style: {
          marginTop: 10
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("p", {
          className: "description",
          style: {
            marginBottom: 6
          },
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Or create a new substory post:', 'cns-story-suite')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Flex, {
          gap: 2,
          align: "flex-end",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
            style: {
              flex: 1
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextControl, {
              __next40pxDefaultSize: true,
              __nextHasNoMarginBottom: true,
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('New substory title', 'cns-story-suite'),
              hideLabelFromVision: true,
              placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('New substory title…', 'cns-story-suite'),
              value: newTitle,
              onChange: setNewTitle,
              onKeyDown: e => {
                if (e.key === 'Enter') handleCreateSubstory();
              }
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
            variant: "secondary",
            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"],
            isBusy: creating,
            disabled: creating || !newTitle.trim(),
            onClick: handleCreateSubstory,
            children: creating ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Creating…', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Create', 'cns-story-suite')
          })]
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
      className: "cns-modal-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("h3", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Display Overrides', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("p", {
        className: "description",
        style: {
          marginBottom: 12
        },
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Leave blank to use the substory post’s title and excerpt.', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        className: "cns-grid cns-grid__12",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group cns-grid__span-full",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextControl, {
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Title', 'cns-story-suite'),
            value: form.titleOverride,
            placeholder: form.substoryLabel || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Node title…', 'cns-story-suite'),
            onChange: v => set('titleOverride', v)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group cns-grid__span-full",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextareaControl, {
            __nextHasNoMarginBottom: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Excerpt', 'cns-story-suite'),
            rows: 3,
            value: form.excerptOverride,
            placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Short description shown in the story window…', 'cns-story-suite'),
            onChange: v => set('excerptOverride', v)
          })
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
      className: "cns-modal-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("h3", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Position', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        className: "cns-grid cns-grid__12",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
            __next40pxDefaultSize: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('X (%)', 'cns-story-suite'),
            min: 0,
            max: 100,
            step: 0.1,
            value: Math.round(form.x * 1000) / 10,
            onChange: v => set('x', Math.max(0, Math.min(1, (parseFloat(v ?? '') || 0) / 100)))
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
            __next40pxDefaultSize: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Y (%)', 'cns-story-suite'),
            min: 0,
            max: 100,
            step: 0.1,
            value: Math.round(form.y * 1000) / 10,
            onChange: v => set('y', Math.max(0, Math.min(1, (parseFloat(v ?? '') || 0) / 100)))
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("p", {
        className: "description",
        style: {
          marginTop: 6
        },
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Position as a percentage of canvas width/height from the top-left. Also adjustable by clicking or dragging on the canvas.', 'cns-story-suite')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
      className: "cns-modal-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("h3", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Node Appearance', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        className: "cns-grid cns-grid__12",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
          className: "cns-grid__group cns-grid__span-full",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.RadioControl, {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Shape', 'cns-story-suite'),
            selected: form.iconType,
            options: SHAPE_OPTIONS.filter(o => o.value !== 'thumbnail' || !!form.substoryId),
            onChange: v => set('iconType', v)
          }), form.iconType === 'thumbnail' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("p", {
            className: "description",
            style: {
              marginTop: 6
            },
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Uses the substory’s featured image, clipped to a circle.', 'cns-story-suite')
          }), !form.substoryId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("p", {
            className: "description",
            style: {
              marginTop: 6,
              color: '#888'
            },
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Link a substory above to enable the Thumbnail option.', 'cns-story-suite')
          })]
        }), form.iconType === 'icon' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group cns-grid__span-full",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.BaseControl, {
            __nextHasNoMarginBottom: true,
            id: "cns-node-icon-image",
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Icon Image', 'cns-story-suite'),
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
              className: "cns-actions-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_shared_MediaSelectButton__WEBPACK_IMPORTED_MODULE_8__["default"], {
                title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Select Icon', 'cns-story-suite'),
                value: form.iconId,
                icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
                onSelect: att => set('iconId', att.id),
                children: form.iconId ? `Icon #${form.iconId}` : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Select Icon', 'cns-story-suite')
              }), form.iconId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
                variant: "tertiary",
                isDestructive: true,
                icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__["default"],
                label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Remove icon', 'cns-story-suite'),
                onClick: () => set('iconId', null)
              })]
            })
          })
        }), (form.iconType === 'icon' || form.iconType === 'thumbnail') && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group cns-grid__span-full",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.RadioControl, {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Background shape', 'cns-story-suite'),
            selected: form.iconBgShape,
            options: (form.iconType === 'thumbnail' ? ['round', 'square'] : ['none', 'round', 'square']).map(s => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1)
            })),
            onChange: v => set('iconBgShape', v)
          })
        }), (form.iconType === 'icon' || form.iconType === 'thumbnail') && form.iconBgShape !== 'none' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_shared_ColorField__WEBPACK_IMPORTED_MODULE_7__["default"], {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Background color', 'cns-story-suite'),
            value: form.iconBgColor,
            onChange: v => set('iconBgColor', v)
          })
        }), !['icon', 'thumbnail'].includes(form.iconType) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_shared_ColorField__WEBPACK_IMPORTED_MODULE_7__["default"], {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Fill color', 'cns-story-suite'),
            value: form.iconColor,
            onChange: v => set('iconColor', v)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_shared_ColorField__WEBPACK_IMPORTED_MODULE_7__["default"], {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Border color', 'cns-story-suite'),
            value: form.iconBorderColor,
            onChange: v => set('iconBorderColor', v)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.RangeControl, {
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Border width (px)', 'cns-story-suite'),
            min: 0,
            max: 10,
            step: 0.5,
            withInputField: true,
            value: form.iconBorderWidth,
            onChange: v => set('iconBorderWidth', v ?? 2)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.RangeControl, {
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Size (×)', 'cns-story-suite'),
            min: 0.25,
            max: 3,
            step: 0.25,
            withInputField: true,
            value: form.iconSize,
            onChange: v => set('iconSize', v ?? 1)
          })
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
      className: "cns-modal-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("h3", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Story Path', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Path', 'cns-story-suite'),
        hideLabelFromVision: true,
        help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Assign this node to a path to inherit its marker settings.', 'cns-story-suite'),
        value: form.pathId !== null ? String(form.pathId) : '',
        options: [{
          value: '',
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('— No path (use global settings) —', 'cns-story-suite')
        }, ...paths.map(p => ({
          value: String(p.id),
          label: p.label || `Path #${p.id}`
        }))],
        onChange: v => set('pathId', v ? parseInt(v, 10) : null)
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
      className: "cns-modal-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("h3", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Individual Marker Override', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("p", {
        className: "description",
        style: {
          marginBottom: 10
        },
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Overrides path and global settings for this node only. Leave a field unchecked to inherit.', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        className: "cns-grid cns-grid__12",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group cns-grid__span-full",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.RadioControl, {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Marker type', 'cns-story-suite'),
            selected: form.markerType,
            options: [{
              value: 'inherit',
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Inherit', 'cns-story-suite')
            }, {
              value: 'ring',
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Ring', 'cns-story-suite')
            }, {
              value: 'icon',
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Icon', 'cns-story-suite')
            }],
            onChange: v => set('markerType', v)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
          className: "cns-grid__group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.CheckboxControl, {
            __nextHasNoMarginBottom: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Color override', 'cns-story-suite'),
            checked: form.markerColor !== null,
            onChange: checked => set('markerColor', checked ? '#00aaff' : null)
          }), form.markerColor !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_shared_ColorField__WEBPACK_IMPORTED_MODULE_7__["default"], {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Marker color', 'cns-story-suite'),
            value: form.markerColor,
            onChange: v => set('markerColor', v)
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
          className: "cns-grid__group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.CheckboxControl, {
            __nextHasNoMarginBottom: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Size override', 'cns-story-suite'),
            checked: form.markerSize !== null,
            onChange: checked => set('markerSize', checked ? 5 : null)
          }), form.markerSize !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.RangeControl, {
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Marker size (px)', 'cns-story-suite'),
            hideLabelFromVision: true,
            min: 1,
            max: 30,
            step: 1,
            withInputField: true,
            value: form.markerSize,
            onChange: v => set('markerSize', v ?? 5)
          })]
        }), form.markerType === 'icon' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
          className: "cns-grid__group cns-grid__span-full",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.BaseControl, {
            __nextHasNoMarginBottom: true,
            id: "cns-node-marker-icon",
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Marker icon', 'cns-story-suite'),
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
              className: "cns-actions-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_shared_MediaSelectButton__WEBPACK_IMPORTED_MODULE_8__["default"], {
                title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Select Marker Icon', 'cns-story-suite'),
                value: form.markerIconId,
                allowedTypes: ['image'],
                icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
                onSelect: att => set('markerIconId', att.id),
                children: form.markerIconId ? `Icon #${form.markerIconId}` : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Select icon', 'cns-story-suite')
              }), form.markerIconId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
                variant: "tertiary",
                isDestructive: true,
                icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__["default"],
                label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Remove marker icon', 'cns-story-suite'),
                onClick: () => set('markerIconId', null)
              })]
            })
          })
        }), form.markerType === 'icon' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.Fragment, {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
            className: "cns-grid__group",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.CheckboxControl, {
              __nextHasNoMarginBottom: true,
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Offset X override', 'cns-story-suite'),
              checked: form.markerIconOffsetX !== null,
              onChange: checked => set('markerIconOffsetX', checked ? 0 : null)
            }), form.markerIconOffsetX !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
              __next40pxDefaultSize: true,
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Offset X (px)', 'cns-story-suite'),
              hideLabelFromVision: true,
              min: -100,
              max: 100,
              step: 1,
              value: form.markerIconOffsetX,
              onChange: v => set('markerIconOffsetX', parseFloat(v ?? '') || 0)
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
            className: "cns-grid__group",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.CheckboxControl, {
              __nextHasNoMarginBottom: true,
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Offset Y override', 'cns-story-suite'),
              checked: form.markerIconOffsetY !== null,
              onChange: checked => set('markerIconOffsetY', checked ? -30 : null)
            }), form.markerIconOffsetY !== null && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
              __next40pxDefaultSize: true,
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Offset Y (px)', 'cns-story-suite'),
              hideLabelFromVision: true,
              min: -100,
              max: 100,
              step: 1,
              value: form.markerIconOffsetY,
              onChange: v => set('markerIconOffsetY', parseFloat(v ?? '') || 0)
            })]
          })]
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Flex, {
      justify: "flex-end",
      gap: 2,
      style: {
        marginTop: 16
      },
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "tertiary",
        onClick: onClose,
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Cancel', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "primary",
        isBusy: saving,
        disabled: saving,
        onClick: handleSave,
        children: saving ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Saving…', 'cns-story-suite') : isNew ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Add Node', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Save Node', 'cns-story-suite')
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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _shared_MarkerControls__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../shared/MarkerControls */ "./src/admin/app/shared/MarkerControls.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);





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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Modal, {
    title: isNew ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Add Path', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Edit Path', 'cns-story-suite'),
    onRequestClose: onClose,
    size: "medium",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "cns-modal-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("h3", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Path Label', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextControl, {
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Label', 'cns-story-suite'),
        hideLabelFromVision: true,
        placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('e.g. Main storyline', 'cns-story-suite'),
        value: form.label,
        onChange: v => set('label', v)
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "cns-modal-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("h3", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Marker Settings', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
        className: "description",
        style: {
          marginBottom: 10
        },
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('These override the global marker for all nodes in this path (unless overridden per-node).', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_shared_MarkerControls__WEBPACK_IMPORTED_MODULE_3__["default"], {
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
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Flex, {
      justify: "flex-end",
      gap: 2,
      style: {
        marginTop: 16
      },
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "tertiary",
        onClick: onClose,
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Cancel', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "primary",
        isBusy: saving,
        disabled: saving || !form.label.trim(),
        onClick: handleSave,
        children: saving ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Saving…', 'cns-story-suite') : isNew ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Add Path', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Save Path', 'cns-story-suite')
      })]
    })]
  });
}

/***/ },

/***/ "./src/admin/app/forms/PathNodesModal.tsx"
/*!************************************************!*\
  !*** ./src/admin/app/forms/PathNodesModal.tsx ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ PathNodesModal)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-down.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-up.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/close-small.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _shared_SubstoryPicker__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../shared/SubstoryPicker */ "./src/admin/app/shared/SubstoryPicker.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);






function getDisplayTitle(node) {
  return node.titleOverride || node.substoryTitle || `Node #${node.id}`;
}

/**
 * Initial sequence for the path's nodes: follow existing connections between
 * path members (branch order = edge sort order), starting from members without
 * an incoming member connection; unconnected members are appended last.
 */
function deriveOrder(members, edges) {
  const memberIds = new Set(members.map(m => m.id));
  const inDegree = new Map(members.map(m => [m.id, 0]));
  for (const e of edges) {
    if (memberIds.has(e.fromNodeId) && memberIds.has(e.toNodeId)) {
      inDegree.set(e.toNodeId, (inDegree.get(e.toNodeId) ?? 0) + 1);
    }
  }
  const visited = new Set();
  const order = [];
  function visit(id) {
    if (visited.has(id)) return;
    visited.add(id);
    order.push(id);
    edges.filter(e => e.fromNodeId === id && memberIds.has(e.toNodeId)).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id).forEach(e => visit(e.toNodeId));
  }
  for (const m of members) {
    if ((inDegree.get(m.id) ?? 0) === 0) visit(m.id);
  }
  for (const m of members) visit(m.id); // cycles / leftovers

  return order;
}
function PathNodesModal({
  path,
  nodes,
  edges,
  onQuickNodeCreate,
  onApply,
  onClose
}) {
  const [orderedIds, setOrderedIds] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => deriveOrder(nodes.filter(n => n.pathId === path.id), edges));
  const [initialIds] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => [...orderedIds]);
  const [applying, setApplying] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [addingSubstory, setAddingSubstory] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= orderedIds.length) return;
    setOrderedIds(p => {
      const next = [...p];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // Story nodes not currently in the list — candidates for "add existing".
  const available = nodes.filter(n => !orderedIds.includes(n.id));
  async function handleAddSubstory(substoryId) {
    if (!substoryId) return;
    setAddingSubstory(true);
    const node = await onQuickNodeCreate(substoryId, path.id);
    if (node) setOrderedIds(p => [...p, node.id]);
    setAddingSubstory(false);
  }
  async function handleApply() {
    setApplying(true);
    const removed = initialIds.filter(id => !orderedIds.includes(id));
    await onApply(path.id, orderedIds, removed);
    setApplying(false);
    onClose();
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Modal, {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.sprintf)(/* translators: %s: path label */
    (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Manage Nodes — %s', 'cns-story-suite'), path.label || `Path #${path.id}`),
    onRequestClose: onClose,
    size: "medium",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("p", {
      className: "description",
      style: {
        marginTop: 0
      },
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Nodes are connected top-to-bottom in the order below. Applying replaces the connections between these nodes; connections to nodes outside the list are kept.', 'cns-story-suite')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
      className: "cns-path-nodes-list",
      children: [orderedIds.length === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("p", {
        className: "description",
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('No nodes in this path yet.', 'cns-story-suite')
      }), orderedIds.map((id, index) => {
        const node = nodeMap.get(id);
        if (!node) return null;
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
          className: "cns-path-nodes-list__item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("span", {
            className: "cns-path-nodes-list__index",
            children: [index + 1, "."]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("span", {
            className: "cns-node-swatch",
            style: {
              background: node.iconType === 'thumbnail' || node.iconType === 'icon' ? 'transparent' : node.iconColor,
              borderRadius: node.iconType === 'square' || node.iconType === 'diamond' ? 2 : '50%',
              transform: node.iconType === 'diamond' ? 'rotate(45deg)' : undefined,
              border: '1px solid rgba(0,0,0,0.3)'
            }
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("span", {
            className: "cns-path-nodes-list__title",
            children: getDisplayTitle(node)
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
            size: "small",
            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"],
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Move up', 'cns-story-suite'),
            disabled: index === 0,
            onClick: () => move(index, -1)
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
            size: "small",
            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Move down', 'cns-story-suite'),
            disabled: index === orderedIds.length - 1,
            onClick: () => move(index, 1)
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
            size: "small",
            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__["default"],
            isDestructive: true,
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Remove from this path', 'cns-story-suite'),
            onClick: () => setOrderedIds(p => p.filter(x => x !== id))
          })]
        }, id);
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
      className: "cns-modal-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("h3", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Add existing node', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.ComboboxControl, {
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Add existing node', 'cns-story-suite'),
        hideLabelFromVision: true,
        placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Search this story’s nodes…', 'cns-story-suite'),
        value: null,
        options: available.map(n => ({
          value: String(n.id),
          label: n.pathId ? `${getDisplayTitle(n)} (${(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('currently in another path', 'cns-story-suite')})` : getDisplayTitle(n)
        })),
        onChange: value => {
          const id = parseInt(value ?? '', 10);
          if (id) setOrderedIds(p => [...p, id]);
        }
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
      className: "cns-modal-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("h3", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Add substory as new node', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("p", {
        className: "description",
        style: {
          marginBottom: 6
        },
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Creates a node at the canvas centre linked to the chosen substory — move it into place on the Canvas tab afterwards.', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_shared_SubstoryPicker__WEBPACK_IMPORTED_MODULE_6__["default"], {
        substoryId: null,
        substoryLabel: "",
        onChange: id => handleAddSubstory(id)
      }), addingSubstory && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("p", {
        className: "description",
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Adding…', 'cns-story-suite')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Flex, {
      justify: "flex-end",
      gap: 2,
      style: {
        marginTop: 16
      },
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "tertiary",
        onClick: onClose,
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Cancel', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "primary",
        isBusy: applying,
        disabled: applying,
        onClick: handleApply,
        children: applying ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Applying…', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Apply Order & Connections', 'cns-story-suite')
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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/link-off.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/link.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../utils */ "./src/admin/utils.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);






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
      const data = await (0,_utils__WEBPACK_IMPORTED_MODULE_5__.mapApiFetch)('GET', path);
      setResults(data.map(item => ({
        id: item.id,
        title: item.title,
        type: linkType
      })));
    } catch {
      /* search failures leave the results empty, as before */
    } finally {
      setLoading(false);
    }
  }
  const linkedIds = new Set(links.filter(l => l.linkType === linkType).map(l => l.linkId));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
    className: "cns-panel cns-links-panel",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("h2", {
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Map Suite Links', 'cns-story-suite')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("p", {
      className: "description",
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Link this story to specific map objects, areas, or hierarchy regions. These relationships are used for cross-referencing in the map editor.', 'cns-story-suite')
    }), links.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("h3", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Linked Entities', 'cns-story-suite')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("table", {
        className: "wp-list-table widefat fixed striped",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("thead", {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("tr", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("th", {
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Type', 'cns-story-suite')
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("th", {
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Entity', 'cns-story-suite')
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("th", {
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Actions', 'cns-story-suite')
            })]
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("tbody", {
          children: links.map(storyLink => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("tr", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("td", {
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("span", {
                className: "cns-badge",
                children: LINK_TYPE_LABELS[storyLink.linkType]
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("td", {
              children: storyLink.linkTitle || `#${storyLink.linkId}`
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("td", {
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
                size: "small",
                icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
                isDestructive: true,
                onClick: () => onLinkDelete(storyLink.id),
                children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Unlink', 'cns-story-suite')
              })
            })]
          }, storyLink.id))
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("h3", {
      style: {
        marginTop: 24
      },
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Add Link', 'cns-story-suite')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
      className: "cns-row-group",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Entity type', 'cns-story-suite'),
        hideLabelFromVision: true,
        value: linkType,
        options: [{
          value: 'map_object',
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Map Object', 'cns-story-suite')
        }, {
          value: 'map_area',
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Map Area', 'cns-story-suite')
        }, {
          value: 'hierarchy',
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Hierarchy Region', 'cns-story-suite')
        }],
        onChange: v => {
          setLinkType(v);
          setResults([]);
        }
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SearchControl, {
        __nextHasNoMarginBottom: true,
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Search entities', 'cns-story-suite'),
        hideLabelFromVision: true,
        placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Search…', 'cns-story-suite'),
        value: search,
        onChange: setSearch,
        onKeyDown: e => {
          if (e.key === 'Enter') handleSearch();
        }
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "secondary",
        isBusy: loading,
        disabled: loading,
        onClick: handleSearch,
        children: loading ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Searching…', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Search', 'cns-story-suite')
      })]
    }), results.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("ul", {
      className: "cns-link-results",
      children: results.map(item => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("li", {
        className: "cns-link-result",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("span", {
          children: item.title || `#${item.id}`
        }), linkedIds.has(item.id) ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("span", {
          className: "cns-badge",
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Linked', 'cns-story-suite')
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          size: "small",
          variant: "primary",
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"],
          onClick: () => onLinkAdd(linkType, item.id),
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Link', 'cns-story-suite')
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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-down.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-up.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/brush.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/close-small.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/pencil.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/star-empty.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/trash.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__);




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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("div", {
      className: "cns-panel",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("p", {
        children: "No nodes yet. Switch to the Canvas tab and click to add your first node."
      })
    });
  }

  // Moves an outgoing edge one slot up/down among its siblings and rewrites
  // every sibling's sort order to its list index, so ties (fresh edges all
  // default to 0) become an explicit, visible order.
  function moveEdge(outEdges, index, dir) {
    const target = index + dir;
    if (target < 0 || target >= outEdges.length) return;
    const reordered = [...outEdges];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reordered.forEach((edge, i) => {
      if (edge.sortOrder !== i) onEdgeReorder(edge.id, i);
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
    className: "cns-panel cns-nodes-panel",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("h2", {
      children: "Story Nodes"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("p", {
      className: "description",
      children: "Click \"Set Start\" to mark the first node visitors will see. Connections are managed via the Canvas tab. The order of a node's outgoing connections decides branch numbering (1.1, 1.2, \u2026) and which branch \"Next\" follows first on the frontend."
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("table", {
      className: "wp-list-table widefat fixed striped",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("thead", {
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("th", {
            style: {
              width: 32
            }
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("th", {
            children: "Node"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("th", {
            children: "Substory"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("th", {
            children: "Outgoing connections"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("th", {
            children: "Actions"
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("tbody", {
        children: nodes.map(node => {
          const outEdges = edges.filter(e => e.fromNodeId === node.id).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("tr", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("td", {
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("span", {
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
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("td", {
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("strong", {
                children: getDisplayTitle(node)
              }), node.id === startNodeId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("span", {
                className: "cns-badge cns-badge--featured",
                style: {
                  marginLeft: 6
                },
                children: "Start"
              }), node.pathId && pathMap.has(node.pathId) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("span", {
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
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("td", {
              children: node.substoryId ? node.substoryEditUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("a", {
                href: node.substoryEditUrl,
                target: "_blank",
                rel: "noopener",
                children: [node.substoryTitle || `Substory #${node.substoryId}`, " \u2197"]
              }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("span", {
                children: node.substoryTitle || `Substory #${node.substoryId}`
              }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("span", {
                className: "description",
                children: "\u2014"
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("td", {
              children: [outEdges.length === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("span", {
                className: "description",
                children: "None"
              }), outEdges.map((edge, index) => {
                const toNode = nodes.find(n => n.id === edge.toNodeId);
                return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
                  className: "cns-edge-row",
                  children: [outEdges.length > 1 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.Fragment, {
                    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
                      size: "small",
                      icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
                      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_8__.__)('Move branch up', 'cns-story-suite'),
                      disabled: index === 0,
                      onClick: () => moveEdge(outEdges, index, -1)
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
                      size: "small",
                      icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__["default"],
                      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_8__.__)('Move branch down', 'cns-story-suite'),
                      disabled: index === outEdges.length - 1,
                      onClick: () => moveEdge(outEdges, index, 1)
                    })]
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("span", {
                    children: ["\u2192 ", toNode ? getDisplayTitle(toNode) : `#${edge.toNodeId}`]
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
                    size: "small",
                    icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"],
                    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_8__.__)('Style this connection', 'cns-story-suite'),
                    onClick: () => onEditEdge(edge.id)
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
                    size: "small",
                    icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__["default"],
                    isDestructive: true,
                    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_8__.__)('Delete connection', 'cns-story-suite'),
                    onClick: () => {
                      if (window.confirm('Delete this connection?')) onEdgeDelete(edge.id);
                    }
                  })]
                }, edge.id);
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("td", {
              className: "cns-maps-actions",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
                className: "cns-actions-row",
                children: [node.id !== startNodeId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
                  size: "small",
                  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_6__["default"],
                  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_8__.__)('Set as start node', 'cns-story-suite'),
                  onClick: () => onSetStartNode(node.id),
                  children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_8__.__)('Set Start', 'cns-story-suite')
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
                  size: "small",
                  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__["default"],
                  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_8__.__)('Edit', 'cns-story-suite'),
                  onClick: () => onEditNode(node.id)
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
                  size: "small",
                  icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_7__["default"],
                  isDestructive: true,
                  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_8__.__)('Delete', 'cns-story-suite'),
                  onClick: () => {
                    if (window.confirm('Delete this node and all its connections?')) {
                      onDeleteNode(node.id);
                    }
                  }
                })]
              })
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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/list-view.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/pencil.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/plus.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/trash.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _forms_PathModal__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../forms/PathModal */ "./src/admin/app/forms/PathModal.tsx");
/* harmony import */ var _forms_PathNodesModal__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../forms/PathNodesModal */ "./src/admin/app/forms/PathNodesModal.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__);







function PathsPanel({
  paths,
  nodes,
  edges,
  onCreatePath,
  onUpdatePath,
  onDeletePath,
  onQuickNodeCreate,
  onPathNodesApply
}) {
  const [modal, setModal] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({
    open: false,
    path: null
  });
  const [nodesModalPath, setNodesModalPath] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
    className: "cns-panel cns-paths-panel",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("h2", {
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Story Paths', 'cns-story-suite')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("p", {
      className: "description",
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Paths group nodes so you can apply shared marker settings. Use "Manage nodes" to order and connect a path’s nodes without the canvas. Priority order: individual node settings > path settings > global settings.', 'cns-story-suite')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("div", {
      style: {
        marginBottom: 12
      },
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "primary",
        icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__["default"],
        onClick: () => setModal({
          open: true,
          path: null
        }),
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Add Path', 'cns-story-suite')
      })
    }), paths.length === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("p", {
      className: "description",
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('No paths yet.', 'cns-story-suite')
    }), paths.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("table", {
      className: "wp-list-table widefat fixed striped",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("thead", {
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("th", {
            style: {
              width: 24
            }
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("th", {
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Label', 'cns-story-suite')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("th", {
            style: {
              width: 80
            },
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Marker', 'cns-story-suite')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("th", {
            style: {
              width: 60
            },
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Nodes', 'cns-story-suite')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("th", {
            style: {
              width: 200
            },
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Actions', 'cns-story-suite')
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("tbody", {
        children: paths.map(path => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("tr", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("td", {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("span", {
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
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("td", {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("strong", {
              children: path.label || `Path #${path.id}`
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("td", {
            style: {
              fontSize: 12,
              color: '#666'
            },
            children: path.markerType === 'ring' ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Ring', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Icon', 'cns-story-suite')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("td", {
            children: nodes.filter(n => n.pathId === path.id).length
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("td", {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
              className: "cns-actions-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
                size: "small",
                icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
                label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Manage nodes: order, connect, add or remove', 'cns-story-suite'),
                onClick: () => setNodesModalPath(path),
                children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Manage nodes', 'cns-story-suite')
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
                size: "small",
                icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"],
                label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Edit', 'cns-story-suite'),
                onClick: () => setModal({
                  open: true,
                  path
                })
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
                size: "small",
                icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__["default"],
                isDestructive: true,
                label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Delete', 'cns-story-suite'),
                onClick: () => {
                  if (window.confirm(`Delete path "${path.label}"? Nodes will become unassigned.`)) {
                    onDeletePath(path.id);
                  }
                }
              })]
            })
          })]
        }, path.id))
      })]
    }), modal.open && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_forms_PathModal__WEBPACK_IMPORTED_MODULE_7__["default"], {
      path: modal.path,
      onSave: handleSave,
      onClose: () => setModal({
        open: false,
        path: null
      })
    }), nodesModalPath && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_forms_PathNodesModal__WEBPACK_IMPORTED_MODULE_8__["default"], {
      path: nodesModalPath,
      nodes: nodes,
      edges: edges,
      onQuickNodeCreate: onQuickNodeCreate,
      onApply: onPathNodesApply,
      onClose: () => setNodesModalPath(null)
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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/image.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/trash.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _shared_MapPicker__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/MapPicker */ "./src/admin/app/shared/MapPicker.tsx");
/* harmony import */ var _shared_MarkerControls__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/MarkerControls */ "./src/admin/app/shared/MarkerControls.tsx");
/* harmony import */ var _shared_MediaSelectButton__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../shared/MediaSelectButton */ "./src/admin/app/shared/MediaSelectButton.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);







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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
    className: "cns-panel cns-settings-panel",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("h2", {
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Story Settings', 'cns-story-suite')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
      className: "cns-grid cns-grid__24",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Flex, {
        className: "cns-grid__span-2",
        direction: "column",
        gap: 4,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.FlexItem, {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.TextControl, {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Title', 'cns-story-suite'),
            value: settings.title,
            onChange: v => set('title', v),
            __next40pxDefaultSize: true
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.FlexItem, {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.TextareaControl, {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Description', 'cns-story-suite'),
            help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Short summary shown in story listings.', 'cns-story-suite'),
            rows: 3,
            value: settings.description,
            onChange: v => set('description', v)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.FlexItem, {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.BaseControl, {
            id: "cns-story-map",
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Map', 'cns-story-suite'),
            help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('The story canvas overlays this map. Objects and areas are shown read-only.', 'cns-story-suite'),
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_shared_MapPicker__WEBPACK_IMPORTED_MODULE_4__["default"], {
              mapId: settings.mapId,
              mapTitle: settings.mapTitle,
              onChange: onMapChange
            })
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
        className: "cns-grid__group cns-grid__span-1",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.BaseControl, {
          id: "cns-story-thumbnail",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Thumbnail', 'cns-story-suite'),
          help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Used as the story’s featured image.', 'cns-story-suite'),
          children: [settings.thumbnailUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
            style: {
              marginBottom: 8
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("img", {
              src: settings.thumbnailUrl,
              alt: "",
              style: {
                maxWidth: 240,
                maxHeight: 160,
                display: 'block',
                borderRadius: 4,
                border: '1px solid #ddd'
              }
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
            className: "cns-actions-row",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_shared_MediaSelectButton__WEBPACK_IMPORTED_MODULE_6__["default"], {
              title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Select Story Thumbnail', 'cns-story-suite'),
              value: settings.thumbnailId,
              allowedTypes: ['image'],
              icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__["default"],
              onSelect: att => onChange({
                ...settings,
                thumbnailId: att.id,
                thumbnailUrl: att.url
              }),
              children: settings.thumbnailId ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Change thumbnail', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Set thumbnail', 'cns-story-suite')
            }), settings.thumbnailId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
              variant: "tertiary",
              isDestructive: true,
              icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Remove thumbnail', 'cns-story-suite'),
              onClick: () => onChange({
                ...settings,
                thumbnailId: null,
                thumbnailUrl: ''
              })
            })]
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
        className: "cns-grid__group cns-grid__span-2",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.BaseControl, {
          id: "cns-story-marker",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Active node marker', 'cns-story-suite'),
          help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Global default. Overridden per-path and per-node.', 'cns-story-suite'),
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_shared_MarkerControls__WEBPACK_IMPORTED_MODULE_5__["default"], {
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
          })
        })
      })]
    })]
  });
}

/***/ },

/***/ "./src/admin/app/panels/StoryCanvasPanel.tsx"
/*!***************************************************!*\
  !*** ./src/admin/app/panels/StoryCanvasPanel.tsx ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ StoryCanvasPanel)
/* harmony export */ });
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/close.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/fullscreen.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _CanvasNodeList__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../CanvasNodeList */ "./src/admin/app/CanvasNodeList.tsx");
/* harmony import */ var _canvas_StoryCanvas__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../canvas/StoryCanvas */ "./src/admin/canvas/StoryCanvas.tsx");
/* harmony import */ var _shared_ColorField__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../shared/ColorField */ "./src/admin/app/shared/ColorField.tsx");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);








function StoryCanvasPanel({
  isNew,
  settings,
  nodes,
  edges,
  paths,
  mapData,
  mapObjects,
  mapAreas,
  canvasMode,
  selectedNodeId,
  edgeStartNodeId,
  onSettingsChange,
  onCanvasModeChange,
  onNodeClick,
  onCanvasClick,
  onEdgeClick,
  onNodeDragEnd,
  onSelectNode,
  onEditNode,
  onDeleteNode,
  onSetStartNode,
  onEdgeReorder,
  onEdgeDelete,
  onStartEdgeFrom,
  onEditEdge,
  onSequenceSwap
}) {
  function set(key, value) {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  }
  // Help information
  const [isVisibleHelpInformation, setIsVisibleHelpInformation] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_7__.useState)(false);
  const toggleVisibleHelpInformation = () => {
    setIsVisibleHelpInformation(state => !state);
  };

  // Fullscreen (lightbox) mode: lock body scroll, Esc exits.
  const [isFullscreen, setIsFullscreen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_7__.useState)(false);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_7__.useEffect)(() => {
    if (!isFullscreen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') setIsFullscreen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('cns-story-canvas-fullscreen-open');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('cns-story-canvas-fullscreen-open');
    };
  }, [isFullscreen]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
    className: "cns-story-canvas-view",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
      className: "cns-story-canvas-toolbar",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
        className: "cns-story-canvas-toolbar__row",
        children: [!isNew && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.__experimentalToggleGroupControl, {
          __next40pxDefaultSize: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Canvas mode', 'cns-story-suite'),
          hideLabelFromVision: true,
          value: canvasMode,
          isAdaptiveWidth: true,
          onChange: value => onCanvasModeChange(value ?? 'select'),
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.__experimentalToggleGroupControlOption, {
            value: "select",
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Select', 'cns-story-suite')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.__experimentalToggleGroupControlOption, {
            value: "add",
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Add', 'cns-story-suite')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.__experimentalToggleGroupControlOption, {
            value: "connect",
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Connect', 'cns-story-suite')
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
          variant: "tertiary",
          onClick: toggleVisibleHelpInformation,
          children: ["Help Information", isVisibleHelpInformation && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Popover, {
            headerTitle: "Help Information",
            expandOnMobile: true,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("ol", {
              style: {
                width: 320,
                maxWidth: '100%'
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("li", {
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("h4", {
                  children: "Connect Mode"
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("ul", {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("li", {
                    children: ["  ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Click a node to start a path.', 'cns-map-suite')]
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("li", {
                    children: ["  ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('When path is active, click next node or press Enter/Esc to finish.', 'cns-map-suite')]
                  })]
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("li", {
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("h4", {
                  children: "Select Mode"
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("ul", {
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("li", {
                    children: ["  ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Click canvas to move node', 'cns-map-suite')]
                  })
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("li", {
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("h4", {
                  children: "Add Mode"
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("ul", {
                  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("li", {
                    children: ["  ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Click canvas to place a new node', 'cns-map-suite')]
                  })
                })]
              })]
            })
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
        className: "cns-story-canvas-toolbar__row cns-story-canvas-toolbar__line-style",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("span", {
          className: "cns-story-canvas-toolbar__label",
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Lines:', 'cns-story-suite')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_shared_ColorField__WEBPACK_IMPORTED_MODULE_6__["default"], {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Color', 'cns-story-suite'),
          value: settings.lineColor,
          onChange: v => set('lineColor', v)
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.__experimentalNumberControl, {
          size: "small",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Width (px)', 'cns-story-suite'),
          min: 0.5,
          max: 20,
          step: 0.5,
          value: settings.lineWidth,
          onChange: v => set('lineWidth', parseFloat(v ?? '') || settings.lineWidth),
          style: {
            width: 70
          }
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.SelectControl, {
          size: "small",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Style', 'cns-story-suite'),
          value: settings.lineStyle,
          options: [{
            value: 'solid',
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Solid', 'cns-story-suite')
          }, {
            value: 'dashed',
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Dashed', 'cns-story-suite')
          }, {
            value: 'dotted',
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Dotted', 'cns-story-suite')
          }],
          onChange: v => set('lineStyle', v)
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
          className: "cns-story-canvas-toolbar__opacity",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.RangeControl, {
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Opacity', 'cns-story-suite'),
            min: 0,
            max: 1,
            step: 0.05,
            withInputField: false,
            value: settings.lineOpacity,
            onChange: v => set('lineOpacity', v ?? 1)
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("span", {
            children: [Math.round(settings.lineOpacity * 100), "%"]
          })]
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
      className: "cns-story-canvas-layout",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("div", {
        className: "cns-story-canvas-main",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
          className: 'cns-story-canvas-wrap' + (isFullscreen ? ' is-fullscreen' : ''),
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
            className: "cns-story-canvas-fs",
            variant: "secondary",
            icon: isFullscreen ? _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__["default"] : _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
            label: isFullscreen ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Exit fullscreen', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('View fullscreen', 'cns-story-suite'),
            onClick: () => setIsFullscreen(f => !f)
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_canvas_StoryCanvas__WEBPACK_IMPORTED_MODULE_5__["default"], {
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
            onNodeClick: onNodeClick,
            onCanvasClick: onCanvasClick,
            onEdgeClick: onEdgeClick,
            onNodeDragEnd: onNodeDragEnd
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("div", {
        className: "cns-story-window-panel",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_CanvasNodeList__WEBPACK_IMPORTED_MODULE_4__["default"], {
          nodes: nodes,
          edges: edges,
          startNodeId: settings.startNodeId,
          selectedNodeId: selectedNodeId,
          onSelect: onSelectNode,
          onEdit: onEditNode,
          onDelete: onDeleteNode,
          onSetStartNode: onSetStartNode,
          onEdgeReorder: onEdgeReorder,
          onEdgeDelete: onEdgeDelete,
          onStartEdgeFrom: onStartEdgeFrom,
          onEditEdge: onEditEdge,
          onSequenceSwap: onSequenceSwap
        })
      })]
    })]
  });
}

/***/ },

/***/ "./src/admin/app/shared/ColorField.tsx"
/*!*********************************************!*\
  !*** ./src/admin/app/shared/ColorField.tsx ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ColorField)
/* harmony export */ });
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



/**
 * Compact color control: a swatch button that opens the wp ColorPicker in a
 * popover — the same pattern the block editor uses for inline color fields.
 */
function ColorField({
  label,
  value,
  onChange
}) {
  const id = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)(`cns-color-${Math.random().toString(36).slice(2)}`);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.BaseControl, {
    __nextHasNoMarginBottom: true,
    id: id.current,
    label: label,
    className: "cns-color-field",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Dropdown, {
      popoverProps: {
        placement: 'bottom-start'
      },
      renderToggle: ({
        isOpen,
        onToggle
      }) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
        id: id.current,
        className: "cns-color-field__toggle",
        onClick: onToggle,
        "aria-expanded": isOpen,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.ColorIndicator, {
          colorValue: value
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
          className: "cns-color-field__value",
          children: value
        })]
      }),
      renderContent: () => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.ColorPicker, {
        color: value,
        onChange: onChange,
        enableAlpha: false
      })
    })
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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/core-data */ "@wordpress/core-data");
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);





/**
 * Async map picker: ComboboxControl over core-data's useEntityRecords for
 * the `maps` post type — resolution state, caching, and request plumbing
 * all come from the wp/core-data store.
 */
function MapPicker({
  mapId,
  mapTitle,
  onChange
}) {
  const [search, setSearch] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const timer = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  const {
    records
  } = (0,_wordpress_core_data__WEBPACK_IMPORTED_MODULE_2__.useEntityRecords)('postType', 'maps', {
    search,
    per_page: 20,
    status: 'publish,private,draft'
  }, {
    enabled: search.length >= 2
  });
  const options = [...(mapId ? [{
    value: String(mapId),
    label: mapTitle || `Map #${mapId}`
  }] : []), ...(records ?? []).filter(r => r.id !== mapId).map(r => ({
    value: String(r.id),
    label: r.title.rendered
  }))];

  // Debounce the store query so we don't resolve every keystroke.
  function handleFilterValueChange(input) {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSearch(input), 300);
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.ComboboxControl, {
    __next40pxDefaultSize: true,
    __nextHasNoMarginBottom: true,
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Map', 'cns-story-suite'),
    hideLabelFromVision: true,
    placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Search maps…', 'cns-story-suite'),
    value: mapId ? String(mapId) : null,
    options: options,
    onFilterValueChange: handleFilterValueChange,
    onChange: value => {
      if (!value) {
        onChange(null, '');
        return;
      }
      const opt = options.find(o => o.value === value);
      onChange(parseInt(value, 10), opt?.label || '');
    },
    allowReset: true
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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/image.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/trash.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _ColorField__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./ColorField */ "./src/admin/app/shared/ColorField.tsx");
/* harmony import */ var _MediaSelectButton__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./MediaSelectButton */ "./src/admin/app/shared/MediaSelectButton.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);






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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
    className: "cns-marker-controls cns-grid cns-grid__12",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
      className: "cns-grid__group cns-grid__span-full",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.RadioControl, {
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Type', 'cns-story-suite'),
        selected: markerType,
        options: [{
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Ring outline', 'cns-story-suite'),
          value: 'ring'
        }, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Icon image', 'cns-story-suite'),
          value: 'icon'
        }],
        onChange: v => onChange({
          markerType: v
        })
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
      className: "cns-grid__group",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_ColorField__WEBPACK_IMPORTED_MODULE_4__["default"], {
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Color', 'cns-story-suite'),
        value: markerColor,
        onChange: v => onChange({
          markerColor: v
        })
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
      className: "cns-grid__group",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.RangeControl, {
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        label: markerType === 'ring' ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Ring size (px)', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Icon size (px)', 'cns-story-suite'),
        min: 1,
        max: 30,
        step: 1,
        withInputField: true,
        value: markerSize,
        onChange: v => onChange({
          markerSize: v ?? 5
        })
      })
    }), markerType === 'icon' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
        className: "cns-grid__group cns-grid__span-full",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.BaseControl, {
          __nextHasNoMarginBottom: true,
          id: "cns-marker-icon",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Icon image', 'cns-story-suite'),
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
            className: "cns-actions-row",
            children: [markerIconUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("img", {
              src: markerIconUrl,
              alt: "",
              style: {
                width: 32,
                height: 32,
                objectFit: 'contain',
                border: '1px solid #ddd',
                borderRadius: 4
              }
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_MediaSelectButton__WEBPACK_IMPORTED_MODULE_5__["default"], {
              title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Select Marker Icon', 'cns-story-suite'),
              value: markerIconId,
              allowedTypes: ['image'],
              icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_1__["default"],
              onSelect: att => onChange({
                markerIconId: att.id,
                markerIconUrl: att.url
              }),
              children: markerIconId ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Change icon', 'cns-story-suite') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Select icon', 'cns-story-suite')
            }), markerIconId && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
              variant: "tertiary",
              isDestructive: true,
              icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Remove icon', 'cns-story-suite'),
              onClick: () => onChange({
                markerIconId: null,
                markerIconUrl: ''
              })
            })]
          })
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
        className: "cns-grid__group cns-grid__span-full",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.BaseControl, {
          __nextHasNoMarginBottom: true,
          id: "cns-marker-presets",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Position preset', 'cns-story-suite'),
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
            className: "cns-actions-row",
            children: PRESETS.map(preset => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
              variant: "secondary",
              size: "small",
              isPressed: markerIconOffsetX === preset.x && markerIconOffsetY === preset.y,
              onClick: () => onChange({
                markerIconOffsetX: preset.x,
                markerIconOffsetY: preset.y
              }),
              children: preset.label
            }, preset.label))
          })
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
        className: "cns-grid__group",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.__experimentalNumberControl, {
          __next40pxDefaultSize: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Offset X (px)', 'cns-story-suite'),
          min: -100,
          max: 100,
          step: 1,
          value: markerIconOffsetX,
          onChange: v => onChange({
            markerIconOffsetX: parseFloat(v ?? '') || 0
          })
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
        className: "cns-grid__group",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.__experimentalNumberControl, {
          __next40pxDefaultSize: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Offset Y (px)', 'cns-story-suite'),
          min: -100,
          max: 100,
          step: 1,
          value: markerIconOffsetY,
          onChange: v => onChange({
            markerIconOffsetY: parseFloat(v ?? '') || 0
          })
        })
      })]
    })]
  });
}

/***/ },

/***/ "./src/admin/app/shared/MediaSelectButton.tsx"
/*!****************************************************!*\
  !*** ./src/admin/app/shared/MediaSelectButton.tsx ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MediaSelectButton)
/* harmony export */ });
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_media_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/media-utils */ "@wordpress/media-utils");
/* harmony import */ var _wordpress_media_utils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_media_utils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



// The published types for MediaUpload declare its props as an untyped class
// component, so we re-type the render-prop surface we actually use.

const Media = _wordpress_media_utils__WEBPACK_IMPORTED_MODULE_1__.MediaUpload;
/**
 * A secondary Button that opens the native media modal via
 * @wordpress/media-utils' MediaUpload render prop.
 */
function MediaSelectButton({
  title,
  value,
  allowedTypes,
  icon,
  onSelect,
  children
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(Media, {
    title: title,
    allowedTypes: allowedTypes,
    multiple: false,
    value: value ?? undefined,
    onSelect: onSelect,
    render: ({
      open
    }) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
      variant: "secondary",
      icon: icon,
      onClick: open,
      children: children
    })
  });
}

/***/ },

/***/ "./src/admin/app/shared/Notices.tsx"
/*!******************************************!*\
  !*** ./src/admin/app/shared/Notices.tsx ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Notices)
/* harmony export */ });
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/notices */ "@wordpress/notices");
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_notices__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);




/**
 * Renders snackbar notices from the wp/notices store — the same pattern the
 * block editor uses. Dispatch with createSuccessNotice/createErrorNotice and
 * `{ type: 'snackbar' }`.
 */

function Notices() {
  const notices = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useSelect)(select => select(_wordpress_notices__WEBPACK_IMPORTED_MODULE_2__.store).getNotices(), []);
  const {
    removeNotice
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useDispatch)(_wordpress_notices__WEBPACK_IMPORTED_MODULE_2__.store);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.SnackbarList, {
    className: "cns-snackbar-list",
    notices: notices.filter(n => n.type === 'snackbar'),
    onRemove: removeNotice
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
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils */ "./src/admin/utils.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);





/**
 * Async substory picker on top of ComboboxControl: typing queries the
 * plugin's /substories endpoint (debounced); clearing resets the link.
 */
function SubstoryPicker({
  substoryId,
  substoryLabel,
  onChange
}) {
  const [results, setResults] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const timer = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  const options = [...(substoryId ? [{
    value: String(substoryId),
    label: substoryLabel || `Substory #${substoryId}`
  }] : []), ...results.filter(r => r.id !== substoryId).map(r => ({
    value: String(r.id),
    label: r.status && r.status !== 'publish' ? `${r.title} (${r.status})` : r.title
  }))];
  function handleFilterValueChange(input) {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const data = await (0,_utils__WEBPACK_IMPORTED_MODULE_3__.apiFetch)('GET', `/substories?search=${encodeURIComponent(input)}&per_page=20`);
        if (Array.isArray(data)) setResults(data);
      } catch {
        /* silent */
      }
    }, 300);
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.ComboboxControl, {
    __next40pxDefaultSize: true,
    __nextHasNoMarginBottom: true,
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Substory post', 'cns-story-suite'),
    hideLabelFromVision: true,
    placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Search substories…', 'cns-story-suite'),
    value: substoryId ? String(substoryId) : null,
    options: options,
    onFilterValueChange: handleFilterValueChange,
    onChange: value => {
      if (!value) {
        onChange(null, '');
        return;
      }
      const opt = options.find(o => o.value === value);
      onChange(parseInt(value, 10), opt?.label || '');
    },
    allowReset: true
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
  drawHierarchyRegions(ctx, W, H, state);
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

// ── Layer: MasterMap child regions (read-only) ────────────────────────────────
// Mirrors cns-map-suite's frontend region rendering so a master map used as a
// story base looks the same as it does on its own page.

function drawHierarchyRegions(ctx, W, H, state) {
  const regions = state.mapData?.hierarchyRegions ?? [];
  for (const region of regions) {
    const pts = region.nodes ?? [];
    if (pts.length < 3) continue;
    const s = region.canvasStyles;
    const fill = s?.fill ?? '#e8a020';
    const fillOpacity = s?.fillOpacity ?? 0.25;
    const stroke = s?.stroke ?? '#e8a020';
    const strokeWidth = s?.strokeWidth ?? 2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x * W, pts[0].y * H);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * W, pts[i].y * H);
    }
    ctx.closePath();
    ctx.save();
    ctx.globalAlpha = fillOpacity;
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.restore();
    if (region.title) {
      const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length * W;
      const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length * H;
      ctx.save();
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 3;
      ctx.strokeText(region.title, cx, cy);
      ctx.fillText(region.title, cx, cy);
      ctx.restore();
    }
  }
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
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__);


/**
 * Thin wrappers over @wordpress/api-fetch pinned to the plugin namespaces.
 * Nonce and REST root come from core's api-fetch middleware. They resolve
 * with the parsed JSON body and reject with the REST error object
 * ({ code, message, data }) on any non-2xx response — callers read
 * `.message` off the rejection.
 */
function apiFetch(method, path, data) {
  return _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({
    path: '/cns-story-suite/v1' + path,
    method,
    data
  });
}
function mapApiFetch(method, path, data) {
  return _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({
    path: '/cns-map-suite/v1' + path,
    method,
    data
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

/***/ "@wordpress/api-fetch"
/*!**********************************!*\
  !*** external ["wp","apiFetch"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["apiFetch"];

/***/ },

/***/ "@wordpress/components"
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["components"];

/***/ },

/***/ "@wordpress/core-data"
/*!**********************************!*\
  !*** external ["wp","coreData"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["coreData"];

/***/ },

/***/ "@wordpress/data"
/*!******************************!*\
  !*** external ["wp","data"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["data"];

/***/ },

/***/ "@wordpress/element"
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["element"];

/***/ },

/***/ "@wordpress/i18n"
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["i18n"];

/***/ },

/***/ "@wordpress/media-utils"
/*!************************************!*\
  !*** external ["wp","mediaUtils"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["mediaUtils"];

/***/ },

/***/ "@wordpress/notices"
/*!*********************************!*\
  !*** external ["wp","notices"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["notices"];

/***/ },

/***/ "@wordpress/primitives"
/*!************************************!*\
  !*** external ["wp","primitives"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["primitives"];

/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/arrow-down.mjs"
/*!***************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/arrow-down.mjs ***!
  \***************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ arrow_down_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/arrow-down.tsx


var arrow_down_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "m16.5 13.5-3.7 3.7V4h-1.5v13.2l-3.8-3.7-1 1 5.5 5.6 5.5-5.6z" }) });

//# sourceMappingURL=arrow-down.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/arrow-left.mjs"
/*!***************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/arrow-left.mjs ***!
  \***************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ arrow_left_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/arrow-left.tsx


var arrow_left_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M20 11.2H6.8l3.7-3.7-1-1L3.9 12l5.6 5.5 1-1-3.7-3.7H20z" }) });

//# sourceMappingURL=arrow-left.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/arrow-up.mjs"
/*!*************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/arrow-up.mjs ***!
  \*************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ arrow_up_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/arrow-up.tsx


var arrow_up_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M12 3.9 6.5 9.5l1 1 3.8-3.7V20h1.5V6.8l3.7 3.7 1-1z" }) });

//# sourceMappingURL=arrow-up.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/brush.mjs"
/*!**********************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/brush.mjs ***!
  \**********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ brush_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/brush.tsx


var brush_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M4 20h8v-1.5H4V20zM18.9 3.5c-.6-.6-1.5-.6-2.1 0l-7.2 7.2c-.4-.1-.7 0-1.1.1-.5.2-1.5.7-1.9 2.2-.4 1.7-.8 2.2-1.1 2.7-.1.1-.2.3-.3.4l-.6 1.1H6c2 0 3.4-.4 4.7-1.4.8-.6 1.2-1.4 1.3-2.3 0-.3 0-.5-.1-.7L19 5.7c.5-.6.5-1.6-.1-2.2zM9.7 14.7c-.7.5-1.5.8-2.4 1 .2-.5.5-1.2.8-2.3.2-.6.4-1 .8-1.1.5-.1 1 .1 1.3.3.2.2.3.5.2.8 0 .3-.1.9-.7 1.3z" }) });

//# sourceMappingURL=brush.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/close-small.mjs"
/*!****************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/close-small.mjs ***!
  \****************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ close_small_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/close-small.tsx


var close_small_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z" }) });

//# sourceMappingURL=close-small.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/close.mjs"
/*!**********************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/close.mjs ***!
  \**********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ close_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/close.tsx


var close_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "m13.06 12 6.47-6.47-1.06-1.06L12 10.94 5.53 4.47 4.47 5.53 10.94 12l-6.47 6.47 1.06 1.06L12 13.06l6.47 6.47 1.06-1.06L13.06 12Z" }) });

//# sourceMappingURL=close.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/external.mjs"
/*!*************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/external.mjs ***!
  \*************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ external_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/external.tsx


var external_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M19.5 4.5h-7V6h4.44l-5.97 5.97 1.06 1.06L18 7.06v4.44h1.5v-7Zm-13 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3H17v3a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h3V5.5h-3Z" }) });

//# sourceMappingURL=external.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/fullscreen.mjs"
/*!***************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/fullscreen.mjs ***!
  \***************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ fullscreen_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/fullscreen.tsx


var fullscreen_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M6 4a2 2 0 0 0-2 2v3h1.5V6a.5.5 0 0 1 .5-.5h3V4H6Zm3 14.5H6a.5.5 0 0 1-.5-.5v-3H4v3a2 2 0 0 0 2 2h3v-1.5Zm6 1.5v-1.5h3a.5.5 0 0 0 .5-.5v-3H20v3a2 2 0 0 1-2 2h-3Zm3-16a2 2 0 0 1 2 2v3h-1.5V6a.5.5 0 0 0-.5-.5h-3V4h3Z" }) });

//# sourceMappingURL=fullscreen.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/image.mjs"
/*!**********************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/image.mjs ***!
  \**********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ image_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/image.tsx


var image_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 4.5h14c.3 0 .5.2.5.5v8.4l-3-2.9c-.3-.3-.8-.3-1 0L11.9 14 9 12c-.3-.2-.6-.2-.8 0l-3.6 2.6V5c-.1-.3.1-.5.4-.5zm14 15H5c-.3 0-.5-.2-.5-.5v-2.4l4.1-3 3 1.9c.3.2.7.2.9-.1L16 12l3.5 3.4V19c0 .3-.2.5-.5.5z" }) });

//# sourceMappingURL=image.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/link-off.mjs"
/*!*************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/link-off.mjs ***!
  \*************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ link_off_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/link-off.tsx


var link_off_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M17.031 4.703 15.576 4l-1.56 3H14v.03l-2.324 4.47H9.5V13h1.396l-1.502 2.889h-.95a3.694 3.694 0 0 1 0-7.389H10V7H8.444a5.194 5.194 0 1 0 0 10.389h.17L7.5 19.53l1.416.719L15.049 8.5h.507a3.694 3.694 0 0 1 0 7.39H14v1.5h1.556a5.194 5.194 0 0 0 .273-10.383l1.202-2.304Z" }) });

//# sourceMappingURL=link-off.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/link.mjs"
/*!*********************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/link.mjs ***!
  \*********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ link_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/link.tsx


var link_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M10 17.389H8.444A5.194 5.194 0 1 1 8.444 7H10v1.5H8.444a3.694 3.694 0 0 0 0 7.389H10v1.5ZM14 7h1.556a5.194 5.194 0 0 1 0 10.39H14v-1.5h1.556a3.694 3.694 0 0 0 0-7.39H14V7Zm-4.5 6h5v-1.5h-5V13Z" }) });

//# sourceMappingURL=link.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/list-view.mjs"
/*!**************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/list-view.mjs ***!
  \**************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ list_view_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/list-view.tsx


var list_view_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M3 6h11v1.5H3V6Zm3.5 5.5h11V13h-11v-1.5ZM21 17H10v1.5h11V17Z" }) });

//# sourceMappingURL=list-view.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/pencil.mjs"
/*!***********************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/pencil.mjs ***!
  \***********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ pencil_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/pencil.tsx


var pencil_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "m19 7-3-3-8.5 8.5-1 4 4-1L19 7Zm-7 11.5H5V20h7v-1.5Z" }) });

//# sourceMappingURL=pencil.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/plus-circle.mjs"
/*!****************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/plus-circle.mjs ***!
  \****************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ plus_circle_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/plus-circle.tsx


var plus_circle_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M7.404 16.596a6.5 6.5 0 1 0 9.192-9.192 6.5 6.5 0 0 0-9.192 9.192ZM6.344 6.343a8 8 0 1 0 11.313 11.314A8 8 0 0 0 6.343 6.343Zm4.906 9.407v-3h-3v-1.5h3v-3h1.5v3h3v1.5h-3v3h-1.5Z" }) });

//# sourceMappingURL=plus-circle.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/plus.mjs"
/*!*********************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/plus.mjs ***!
  \*********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ plus_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/plus.tsx


var plus_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z" }) });

//# sourceMappingURL=plus.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/star-empty.mjs"
/*!***************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/star-empty.mjs ***!
  \***************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ star_empty_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/star-empty.tsx


var star_empty_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M9.706 8.646a.25.25 0 01-.188.137l-4.626.672a.25.25 0 00-.139.427l3.348 3.262a.25.25 0 01.072.222l-.79 4.607a.25.25 0 00.362.264l4.138-2.176a.25.25 0 01.233 0l4.137 2.175a.25.25 0 00.363-.263l-.79-4.607a.25.25 0 01.072-.222l3.347-3.262a.25.25 0 00-.139-.427l-4.626-.672a.25.25 0 01-.188-.137l-2.069-4.192a.25.25 0 00-.448 0L9.706 8.646zM12 7.39l-.948 1.921a1.75 1.75 0 01-1.317.957l-2.12.308 1.534 1.495c.412.402.6.982.503 1.55l-.362 2.11 1.896-.997a1.75 1.75 0 011.629 0l1.895.997-.362-2.11a1.75 1.75 0 01.504-1.55l1.533-1.495-2.12-.308a1.75 1.75 0 01-1.317-.957L12 7.39z" }) });

//# sourceMappingURL=star-empty.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/star-filled.mjs"
/*!****************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/star-filled.mjs ***!
  \****************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ star_filled_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/star-filled.tsx


var star_filled_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M11.776 4.454a.25.25 0 01.448 0l2.069 4.192a.25.25 0 00.188.137l4.626.672a.25.25 0 01.139.426l-3.348 3.263a.25.25 0 00-.072.222l.79 4.607a.25.25 0 01-.362.263l-4.138-2.175a.25.25 0 00-.232 0l-4.138 2.175a.25.25 0 01-.363-.263l.79-4.607a.25.25 0 00-.071-.222L4.754 9.881a.25.25 0 01.139-.426l4.626-.672a.25.25 0 00.188-.137l2.069-4.192z" }) });

//# sourceMappingURL=star-filled.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/trash.mjs"
/*!**********************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/trash.mjs ***!
  \**********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ trash_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/trash.tsx


var trash_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M12 5.5A2.25 2.25 0 0 0 9.878 7h4.244A2.251 2.251 0 0 0 12 5.5ZM12 4a3.751 3.751 0 0 0-3.675 3H5v1.5h1.27l.818 8.997a2.75 2.75 0 0 0 2.739 2.501h4.347a2.75 2.75 0 0 0 2.738-2.5L17.73 8.5H19V7h-3.325A3.751 3.751 0 0 0 12 4Zm4.224 4.5H7.776l.806 8.861a1.25 1.25 0 0 0 1.245 1.137h4.347a1.25 1.25 0 0 0 1.245-1.137l.805-8.861Z" }) });

//# sourceMappingURL=trash.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/undo.mjs"
/*!*********************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/undo.mjs ***!
  \*********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ undo_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/undo.tsx


var undo_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M18.3 11.7c-.6-.6-1.4-.9-2.3-.9H6.7l2.9-3.3-1.1-1-4.5 5L8.5 16l1-1-2.7-2.7H16c.5 0 .9.2 1.3.5 1 1 1 3.4 1 4.5v.3h1.5v-.2c0-1.5 0-4.3-1.5-5.7z" }) });

//# sourceMappingURL=undo.mjs.map


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