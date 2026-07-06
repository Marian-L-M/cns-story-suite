# CNS Story Suite — Improvement Plan

## Status (updated 2026-07-02, second pass)

**Done & verified:** all P0s (#1–#6); #7 render-path decoupling via map-suite's public API; #8 one shared node/path serializer (`includes/serializers.php`, `$public` flag gates edit URLs + unpublished substories — REST and block render both use it, story block output verified semantically identical); #10 transactions around node/path deletes; #12 N+1s (GROUP BY node counts, `cns_story_suite_prime_node_caches`).

**Deliberately deferred:** #9 declarative REST arg schemas (mechanical, large — own change); #11 shared graph module + tooling/CI; #13 DPR canvas (needs visual verification); #14 payload → JSON script tag; all P3 features. Remaining direct map-table access: `cns_story_suite_resolve_link_title()` only.

---

Reviewed: 2026-07-02. The plugin is functional and the admin/editor side is well organized, but it has a handful of real bugs (one content-disclosure issue, one broken table lookup, one CPU-burning render loop) and it duplicates a lot of logic that should live in cns-map-suite. Ordered by priority.

---

## P0 — Bugs / correctness

### 1. Query against a table that doesn't exist — ✅ FIXED 2026-07-02
`includes/admin/api.php` → `cns_story_suite_resolve_icon_url()` runs:

```php
SELECT url FROM {$wpdb->prefix}cns_map_icons WHERE id = %d
```

There is no `cns_map_icons` table — map-suite stores icons as regular attachments tagged with `_cns_map_icon` meta. Every call fails silently (`$wpdb->last_error` set, logged under `SAVEQUERIES`/Query Monitor), then falls through to `wp_get_attachment_url()`. The function should just be `wp_get_attachment_url($icon_id) ?: ''`. Delete the query.

> **Status:** Fixed — the function now resolves straight to `wp_get_attachment_url()`. Verified at runtime: returns the attachment URL with `$wpdb->last_error` empty.

### 2. Draft/private stories leak through the block — ✅ FIXED 2026-07-02
`src/blocks/story/render.php` validates only that the post exists and is `cns_story` — it never checks `post_status` or capabilities. Anyone who can place the block (or any page containing `<!-- wp:cns-story-suite/story {"storyId":N} -->`) renders a draft/private story's full node graph, titles, excerpts, and substory excerpts to anonymous visitors. Compare with map-suite's `render.php`, which gates private on `read_private_posts` and non-published on `manage_maps`. Copy that gate verbatim.

Related: in the same file the node mapper sets `substoryUrl = get_permalink($sub->ID)` unconditionally, while the REST layer correctly only exposes URLs for publish/private substories. Apply the same status check here, and consider omitting draft substories' titles/excerpts entirely on the frontend.

> **Status:** Fixed. `render.php` now gates the story (private → `read_private_posts`; other non-published → `manage_stories`) and only surfaces substory data when the substory is published or the viewer passes `current_user_can('read_post')`, with permalinks restricted to publish/private. Verified anonymously: draft story renders 0 bytes via `render_block()`, draft substory title no longer appears on the published story page.

### 3. Infinite requestAnimationFrame loop — ✅ FIXED 2026-07-02
`src/blocks/story/view.js` (`initBlock`):

```js
requestAnimationFrame( function loop() { redraw(); requestAnimationFrame( loop ); } );
```

The full canvas redraws at 60 fps forever, on every story block, even when nothing changes — measurable CPU/battery drain on idle pages. The loop only exists to catch images finishing loading. Replace with event-driven redraws:
- `loadImg()` sets `img.onload = scheduleRedraw` (debounced via one rAF);
- redraw on `activeNodeId` change (already goes through `rerender()`);
- redraw on resize if you adopt DPR scaling.

> **Status:** Fixed — `loadImg(url, onLoad)` attaches a one-shot load listener, `drawStory()` threads a per-block `scheduleRedraw` (coalesced to one rAF) through all image call sites, and the free-running loop is deleted. Built asset verified: exactly one `requestAnimationFrame` call site remains (the scheduler).

### 4. Area shapes ignore `shape_type` — ✅ FIXED 2026-07-02
Both `drawStory()` and the click handler treat every map area as a straight-line polygon. Map-suite renders `BEZIER` (quadratic-smoothed) and `CIRCLE` (ellipse from 2 nodes) shapes, so the same area looks different on the story canvas than on the map, and circle areas (only 2 nodes) are skipped entirely (`pts.length < 2` passes but a 2-point "polygon" is a line). Reuse map-suite's path builders — see structural item #7.

> **Status:** Fixed — map-suite's polygon/bezier/circle path builders are ported into `view.js` as a shared `buildAreaPath()` used by both `drawStory()` and the click hit-test, with per-shape minimum node counts. (True cross-plugin sharing of this code remains part of #7/#11.)

### 5. Background image is stretched, not cover-fitted — ✅ FIXED 2026-07-02
`drawStory()` draws the bg image as `ctx.drawImage(bg, 0, 0, W, H)`; map-suite computes a cover-fit scale. Same map, different geometry between the two canvases. Port the cover-fit logic.

> **Status:** Fixed — background now cover-fits and centers exactly like map-suite.

### 6. Small API inconsistencies — ✅ FIXED 2026-07-02
- `cns_story_suite_api_save_story()` never validates `map_id` points at an existing `maps` post.
- `_cns_story_marker_*` meta keys are written but not registered in `cns_story_suite_register_post_meta()` (only the line/start-node keys are).
- `post-types.php` puts `'tags'` and `'categories'` in `supports` — those aren't valid `supports` values (taxonomies are already handled by the `taxonomies` key). Remove them.
- `uninstall.php`'s doc comment omits `cns_story_paths` (the code handles it; the comment is stale).

> **Status:** All four fixed. Verified at runtime: save with `map_id=99999` returns `WP_Error invalid_map` (400) before any write; `_cns_story_marker_color` reports as registered; `cns_story` supports list is now `title,editor,excerpt,thumbnail,custom-fields`.

---

## P1 — Structure & code quality

### 7. Stop reaching into cns-map-suite's tables — ✅ DONE 2026-07-02 (render path)
`cns_story_suite_get_map_render_data()` queries `cns_map_objects`/`cns_map_areas` and re-reads all the `_cns_map_*` meta, and `render.php` runs two more direct queries for infobox columns, duplicating map-suite's resolver closure. This is the biggest architectural debt: story-suite is coupled to another plugin's private schema, and the two copies have already drifted (see P0 #4/#5).

Fix from the map-suite side (see its plan): a public `cns_map_suite_get_map_data($map_id)` + exported infobox resolver. Then this plugin's copy collapses to one function call, and rendering bugs get fixed once.

> **Status:** Done for the render path — `cns_story_suite_get_map_render_data()` is now a thin adapter over `cns_map_suite_get_map_data()` (with `$resolve_infoboxes` flag), and `render.php`'s duplicated resolver closure + two direct infobox queries are deleted. Verified byte-identical story block output before/after. Still direct: the three title lookups in `cns_story_suite_resolve_link_title()` (admin links panel).

### 8. One node serializer, not two
`cns_story_suite_format_node()` (api.php) and the inline mapper in `render.php` are ~90% identical and have already diverged (icon URL resolution, substory URL gating). Extract a shared `includes/serializers.php` with `cns_story_suite_serialize_node(array $row, bool $public): array` where `$public` controls edit-URLs and draft gating.

### 9. Adopt REST arg schemas like map-suite
Every story route registers with no `args`; all validation is hand-rolled in the callbacks (and mostly good — enums are whitelisted, colors sanitized, floats clamped). Moving the constraints into `args` (types, enums, min/max, `sanitize_callback`) makes them declarative, self-documenting in the REST index, and removes ~150 lines of clamping code. The two plugins should feel like one API family.

### 10. Wrap multi-statement mutations in transactions
`delete_node` (edges then node) and `delete_path` (nodes update then path delete) are two statements with no transaction — a mid-flight failure leaves orphans. Tables are InnoDB by default on any modern install: `$wpdb->query('START TRANSACTION')` / `COMMIT` is enough. Alternatively, add `ON DELETE CASCADE`-style cleanup in one `DELETE ... JOIN`.

### 11. Tooling parity
Same as map-suite: PHPCS/WPCS config, CI running `npm run build` + `tsc --noEmit` + PHPCS, and REST integration tests. The node/edge graph logic (`buildOrderedNodes` numbering) is pure and easily unit-tested — it's duplicated in `view.js` and `CanvasNodeList.tsx` ("mirrors CanvasNodeList algorithm" per its own comment), so extract it into a shared module under `src/shared/` and test it once. Same for the duplicated `escHtml`/`esc` helpers and the copy-pasted drawer builder (also duplicated in map-suite's view.js).

---

## P2 — Performance

### 12. N+1 queries
- `cns_story_suite_api_get_map_stories()`: one `COUNT(*)` per story. Replace with a single `GROUP BY story_id` query.
- `format_node()` / render.php: `get_post()` + `get_post_thumbnail_id()` + thumbnail URL per substory node. Collect substory IDs and `_prime_post_caches()` first.

### 13. Canvas sharpness
Same as map-suite: scale the backing store by `devicePixelRatio` and redraw on a debounced resize. Currently `canvas.width = mapWidth` + CSS `max-width:100%` gives soft rendering on retina/small screens.

### 14. Payload size
`data-story-data` embeds the full map data (all objects/areas incl. infobox HTML) as an HTML attribute. Move to the `<script type="application/json">` pattern map-suite uses (no attribute-escaping overhead, ~25% smaller in practice), and skip `infoboxResolved` content for items that can never be clicked.

---

## P3 — Features

- **Reader navigation controls**: the story window is click-to-jump only. Add prev/next buttons that follow edge `sort_order` from the active node (the data model — branch priority — is already there), plus keyboard arrows.
- **Progress persistence**: remember the last active node per story in `localStorage` so returning readers resume where they left off.
- **Branch choice UI**: at a branch point, surface the outgoing edges as explicit "choose your path" options in the story window instead of relying on the flat numbered list.
- **Animated path reveal**: draw edges progressively up to the active node — cheap once the rAF loop is replaced with purposeful redraws.
- **Inline substory reading**: render substory content in the shared drawer (server-side via `cns_map_suite_infobox_content`) instead of forcing navigation away from the map.
- **Story archive block** (`cns-story-suite/archive`) listing published stories with thumbnails — currently stories are only reachable by direct URL or menus.
- **Editor**: unsaved-changes `beforeunload` guard; undo for node moves.

---

## Suggested order of work

1. P0 #1–#3 (the leak, the phantom table, the rAF loop) — same day, high value.
2. P0 #4–#6 shape/status/meta fixes.
3. Land map-suite's public data API, then delete the duplicated map logic here (#7, #8).
4. REST arg schemas + shared graph module + CI (#9, #11).
5. Features, starting with prev/next navigation and progress persistence.
