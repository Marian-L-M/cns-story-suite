=== CNS Story Suite ===
Contributors: namatamago.dev
Tags: story, map, canvas, interactive, custom post type
Requires at least: 6.8
Tested up to: 6.8
Requires PHP: 8.0
Stable tag: 0.1.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Canvas-based branching stories drawn over interactive maps. Requires CNS Map Suite.

== Description ==

CNS Story Suite lets you tell branching stories on top of the maps you build with CNS Map Suite. A story is a set of nodes placed on a map, connected by paths and edges, and embedded into any post or page via a Gutenberg block. Visitors step through the story node by node while the route is drawn live on the map canvas.

**Features**

* Custom `cns_story` post type with a purpose-built admin editor (requires CNS Map Suite)
* Nodes placed directly on a map canvas, connected by ordered paths and free-form edges
* Per-story line styling (color, width, dash style, opacity) with per-edge overrides
* Node markers as rings or custom icons, with per-path and per-node color/size/offset overrides
* Substories — a `cns_substory` post type for the content behind each node; the story window shows the substory's title, excerpt and thumbnail, linking to the full post
* Embeds into posts and pages via the **CNS Story** block
* Reads map data through CNS Map Suite's public API, so MasterMap regions, areas and objects render exactly as they do on the map's own page

**Stories and substories**

Each node can link to a substory post (or carry a manual title/excerpt override). As visitors advance through the story, the active node is highlighted on the canvas and the story window updates with that node's content.

== Installation ==

1. Install and activate **CNS Map Suite** (required — CNS Story Suite deactivates itself without it).
2. Upload the `cns-story-suite` folder to `/wp-content/plugins/`.
3. Run `npm install --legacy-peer-deps && npm run build` inside the plugin directory.
4. Activate the plugin via **Plugins → Installed Plugins**.
5. Navigate to **Stories** (or the CNS admin panel if the Clouds and Spaceships theme is active), create a story, pick a base map, and place your first nodes.
6. Embed the story into any post using the **CNS Story** block in the block editor.

== Frequently Asked Questions ==

= Does this plugin work without CNS Map Suite? =

No. Stories are drawn over maps, so CNS Map Suite must be installed and active. The plugin refuses to activate without it and shows an admin notice if the dependency disappears later.

= Can I give non-administrator users access to manage stories? =

Yes. The plugin adds a `manage_stories` primitive capability to the administrator role on activation. You can assign it to any other role using a role management plugin such as Members or User Role Editor.

= What happens to my stories if I uninstall the plugin? =

By default, story and substory posts are kept — only the custom database tables (nodes, paths, edges, links) and plugin options are removed. If you want the posts deleted on uninstall as well, enable the option in the plugin settings before deleting the plugin.

= Why is the standard Gutenberg editor disabled for stories? =

Stories are canvas-based content: nodes, paths and edges on a map. The plugin provides its own editor tailored to that workflow; substories, which hold the actual written content, use the normal block editor.

== Screenshots ==

1. Stories overview — list of all stories with edit and delete actions.
2. Story editor — node placement on the map canvas with path and edge management.
3. Frontend — story block with the route drawn on the map and the story window beside it.

== Changelog ==

= 0.1.0 =
* Initial release — story and substory CPTs, custom DB tables, admin story editor, CNS Story block, REST API.

== Upgrade Notice ==

= 0.1.0 =
Initial release.
