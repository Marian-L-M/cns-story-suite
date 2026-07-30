# CNS Story Suite — TODO & Audit

## Audit Findings (2026-06-03)

### Critical

- [x] **C-1** `includes/admin/views/overview.php:172` — Settings POST handled after HTML output; `wp_safe_redirect()` silently fails. Moved handler to `admin_init` hook in `menu.php`; added `settings-saved` notice.
- [x] **C-2** `uninstall.php:19` — `cns_story_paths` table never dropped on uninstall. Added to `$tables` array.
- [x] **C-3** `includes/admin/menu.php:195` — Story deletion didn't clean up `cns_story_paths`. Added `$wpdb->delete` call to delete handler.
- [x] **C-4** `includes/admin/api.php:610, 1112` — `create_node` and `create_path` didn't check insert failure before reading `insert_id`. Fixed with `$wpdb->last_error` check.
- [x] **C-5** `includes/admin/api.php:1013` — `create_link` conflated real insert failure with duplicate-key. Fixed: capture `$wpdb->insert()` return, check `=== false` for real errors, null-check existing row on duplicate.

### High

- [ ] **H-1** `src/blocks/story/render.php:114` — Draft/private substory content (title, excerpt, thumbnail, permalink) leaked in public block HTML. Add `post_status` gate.
- [ ] **H-2** `src/blocks/story/render.php:17` — No `post_status` check on the story itself; private/draft story data embedded in public pages.
- [x] **H-3** `includes/admin/views/overview.php:179` — `?settings-saved=1` redirect target had no notice. Fixed alongside C-1.
- [ ] **H-4** `src/blocks/story/render.php` vs `includes/admin/api.php` — Duplicate `format_node` logic diverges; `render.php` omits the `post_status` gate on substory URL that `api.php` correctly applies.
- [x] **H-5** `includes/admin/api.php:364` — `wp_update_post()` return value ignored; silent failure returns a success response. Fixed: capture return, check `is_wp_error()`.
- [ ] **H-6** `src/blocks/story/view.js:546` — `requestAnimationFrame` loop runs forever with no cancellation or Intersection Observer; multiple blocks = multiple infinite loops.
- [ ] Story tab breaks when switch from a map tab with canvas

### Medium

- [ ] **M-1** `includes/admin/api.php:607, 711` — `marker_size`/offsets use `'%s'` format specifier for FLOAT columns.
- [ ] **M-2** `src/admin/app/StoryEditorApp.tsx:76` — Initial load `useEffect` IIFE has no try/catch; loading spinner can stick forever on network error.
- [ ] **M-3** `src/admin/app/StoryEditorApp.tsx:170+` — All CRUD handlers silently do nothing on API failure; no error surfaced to user.
- [ ] **M-4** Multiple `.tsx` files — `window.confirm()` used in 6 places across React components.
- [ ] **M-5** `src/admin/app/forms/NodeModal.tsx:52`, `PathModal.tsx:28` — Stale `onClose` closure in `useEffect(fn, [])`.
- [ ] **M-6** `src/admin/app/shared/SubstoryPicker.tsx:17` — `search` function missing from `useEffect` dependency array.
- [ ] **M-7** `src/admin/app/StoryEditorApp.tsx:152` — Unnecessary fetch in `handleMapChange`; result is discarded.
- [ ] **M-8** `src/blocks/story/view.js:50` — `keydown` listener on `document` never removed.
- [ ] **M-9** `includes/admin/views/overview.php:18` — `?deleted` notice renders on any manual URL visit with that param.
- [ ] **M-10** `includes/admin/views/overview.php:173` — Settings POST handler has no `current_user_can` check.
- [ ] **M-11** `includes/post-types.php:32` — `capability_type='post'` lets any `edit_posts` user bypass `manage_stories` via REST API/Block Editor.

### Low

- [ ] **L-1** `src/blocks/story/view.js:19` — Dead `escHtml()` function (duplicate of `esc()`).
- [ ] **L-2** `src/blocks/story/view.js:69, 72` — `encodeURI()` in innerHTML attribute should also pass through `esc()`.
- [ ] **L-3** `src/blocks/story/view.js:594` — Node hit detection uses radius math; diamond/square hit area doesn't match visual shape.
- [ ] **L-4** `src/admin/app/forms/NodeModal.tsx:64` — `initialX`/`initialY` missing from `useEffect` dependency array.
- [ ] **L-5** `includes/post-types.php:70` — Only 6 of 12 story meta keys registered via `register_post_meta()`.

---

## Feature Backlog

- [ ] Bezier path rendering (smooth curves between nodes)
- [ ] Responsive canvas — scale to container width, maintain aspect ratio
- [ ] Keyboard navigation and focus management for the story window
- [ ] Path reordering UI (sort_order field exists but no drag-to-reorder)
- [ ] Static/cached render data to reduce DB load on page load
