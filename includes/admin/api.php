<?php

defined('ABSPATH') || exit;

// ── Route registration ────────────────────────────────────────────────────────

add_action('rest_api_init', 'cns_story_suite_register_routes');

function cns_story_suite_register_routes(): void {
	$ns = 'cns-story-suite/v1';

	register_rest_route($ns, '/stories', [
		'methods'             => 'POST',
		'callback'            => 'cns_story_suite_api_save_story',
		'permission_callback' => 'cns_story_suite_api_can_manage',
	]);

	register_rest_route($ns, '/stories/(?P<id>\d+)/data', [
		'methods'             => 'GET',
		'callback'            => 'cns_story_suite_api_get_story_data',
		'permission_callback' => 'cns_story_suite_api_can_manage',
	]);

	register_rest_route($ns, '/maps/(?P<id>\d+)/stories', [
		'methods'             => 'GET',
		'callback'            => 'cns_story_suite_api_get_map_stories',
		'permission_callback' => 'cns_story_suite_api_can_manage',
	]);

	register_rest_route($ns, '/stories/(?P<id>\d+)/nodes', [
		'methods'             => 'POST',
		'callback'            => 'cns_story_suite_api_create_node',
		'permission_callback' => 'cns_story_suite_api_can_manage',
	]);

	register_rest_route($ns, '/nodes/(?P<id>\d+)', [
		[
			'methods'             => 'PATCH',
			'callback'            => 'cns_story_suite_api_update_node',
			'permission_callback' => 'cns_story_suite_api_can_manage',
		],
		[
			'methods'             => 'DELETE',
			'callback'            => 'cns_story_suite_api_delete_node',
			'permission_callback' => 'cns_story_suite_api_can_manage',
		],
	]);

	register_rest_route($ns, '/edges', [
		'methods'             => 'POST',
		'callback'            => 'cns_story_suite_api_create_edge',
		'permission_callback' => 'cns_story_suite_api_can_manage',
	]);

	register_rest_route($ns, '/edges/(?P<id>\d+)', [
		[
			'methods'             => 'PATCH',
			'callback'            => 'cns_story_suite_api_update_edge',
			'permission_callback' => 'cns_story_suite_api_can_manage',
		],
		[
			'methods'             => 'DELETE',
			'callback'            => 'cns_story_suite_api_delete_edge',
			'permission_callback' => 'cns_story_suite_api_can_manage',
		],
	]);

	register_rest_route($ns, '/substories', [
		[
			'methods'             => 'GET',
			'callback'            => 'cns_story_suite_api_search_substories',
			'permission_callback' => 'cns_story_suite_api_can_manage',
		],
		[
			'methods'             => 'POST',
			'callback'            => 'cns_story_suite_api_create_substory',
			'permission_callback' => 'cns_story_suite_api_can_manage',
		],
	]);

	register_rest_route($ns, '/stories/(?P<id>\d+)/links', [
		[
			'methods'             => 'GET',
			'callback'            => 'cns_story_suite_api_get_links',
			'permission_callback' => 'cns_story_suite_api_can_manage',
		],
		[
			'methods'             => 'POST',
			'callback'            => 'cns_story_suite_api_create_link',
			'permission_callback' => 'cns_story_suite_api_can_manage',
		],
	]);

	register_rest_route($ns, '/links/(?P<id>\d+)', [
		'methods'             => 'DELETE',
		'callback'            => 'cns_story_suite_api_delete_link',
		'permission_callback' => 'cns_story_suite_api_can_manage',
	]);
}

function cns_story_suite_api_can_manage(): bool {
	return current_user_can('manage_stories');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cns_story_suite_resolve_icon_url(int $icon_id): string {
	if (! $icon_id) return '';
	global $wpdb;
	// Query map-suite icon library; falls back to WP attachment if not found.
	$row = $wpdb->get_row(
		$wpdb->prepare(
			"SELECT url FROM {$wpdb->prefix}cns_map_icons WHERE id = %d",
			$icon_id
		)
	);
	if ($row && ! empty($row->url)) {
		return $row->url;
	}
	return (string) (wp_get_attachment_url($icon_id) ?: '');
}

function cns_story_suite_format_node(array $row): array {
	$node = [
		'id'               => (int) $row['id'],
		'storyId'          => (int) $row['story_id'],
		'substoryId'       => $row['substory_id'] ? (int) $row['substory_id'] : null,
		'titleOverride'    => $row['title_override'],
		'excerptOverride'  => $row['excerpt_override'],
		'x'                => (float) $row['x'],
		'y'                => (float) $row['y'],
		'iconType'         => $row['icon_type'],
		'iconId'           => $row['icon_id'] ? (int) $row['icon_id'] : null,
		'iconUrl'          => $row['icon_id'] ? cns_story_suite_resolve_icon_url((int) $row['icon_id']) : null,
		'iconColor'        => $row['icon_color'],
		'iconSize'         => (float) $row['icon_size'],
		'createdAt'        => $row['created_at'],
		'substoryTitle'         => null,
		'substoryExcerpt'       => null,
		'substoryThumbnailUrl'  => null,
		'substoryUrl'           => null,
		'substoryEditUrl'       => null,
	];

	if ($row['substory_id']) {
		$sub = get_post((int) $row['substory_id']);
		if ($sub && $sub->post_type === 'cns_substory') {
			$node['substoryTitle']   = $sub->post_title;
			$node['substoryExcerpt'] = $sub->post_excerpt ?: wp_trim_excerpt('', $sub);
			$thumb_id = (int) get_post_thumbnail_id($sub->ID);
			$node['substoryThumbnailUrl'] = $thumb_id
				? (wp_get_attachment_image_url($thumb_id, 'medium') ?: null)
				: null;
			$node['substoryUrl']     = in_array($sub->post_status, ['publish', 'private'], true)
				? get_permalink($sub->ID)
				: null;
			$node['substoryEditUrl'] = get_edit_post_link($sub->ID, 'raw');
		}
	}

	return $node;
}

function cns_story_suite_format_edge(array $row): array {
	return [
		'id'         => (int) $row['id'],
		'storyId'    => (int) $row['story_id'],
		'fromNodeId' => (int) $row['from_node_id'],
		'toNodeId'   => (int) $row['to_node_id'],
		'sortOrder'  => (int) $row['sort_order'],
	];
}

function cns_story_suite_get_map_render_data(int $map_id): ?array {
	$map = get_post($map_id);
	if (! $map || $map->post_type !== 'maps') return null;

	global $wpdb;

	$width        = (int)    (get_post_meta($map_id, '_cns_map_width', true)        ?: 1000);
	$aspect_ratio = (float)  (get_post_meta($map_id, '_cns_map_aspect_ratio', true) ?: 1.0);
	$bg_type      = (string) (get_post_meta($map_id, '_cns_map_bg_type', true)      ?: 'color');
	$bg_color     = (string) (get_post_meta($map_id, '_cns_map_bg_color', true)     ?: '#1a1a2e');
	$bg_image_id  = (int)     get_post_meta($map_id, '_cns_map_bg_image_id', true);
	$image_id     = (int)     get_post_meta($map_id, '_cns_map_image_id', true);
	$image_x      = (float)   get_post_meta($map_id, '_cns_map_image_x', true);
	$image_y      = (float)   get_post_meta($map_id, '_cns_map_image_y', true);
	$image_w      = (float)  (get_post_meta($map_id, '_cns_map_image_width', true)  ?: 1.0);

	$raw_objects = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT id, x, y, title, icon_image_id, canvas_styles FROM {$wpdb->prefix}cns_map_objects WHERE map_id = %d",
			$map_id
		),
		ARRAY_A
	) ?: [];

	$objects = array_map(function (array $obj): array {
		$icon_url  = '';
		$icon_mime = '';
		if ($obj['icon_image_id']) {
			$icon_url  = (string) (wp_get_attachment_image_url((int) $obj['icon_image_id'], 'thumbnail') ?: '');
			$icon_mime = (string) (get_post_mime_type((int) $obj['icon_image_id']) ?: '');
		}
		return [
			'id'           => (int) $obj['id'],
			'x'            => (int) $obj['x'],
			'y'            => (int) $obj['y'],
			'title'        => $obj['title'],
			'iconUrl'      => $icon_url,
			'iconMime'     => $icon_mime,
			'canvasStyles' => $obj['canvas_styles'] ? json_decode($obj['canvas_styles'], true) : null,
		];
	}, $raw_objects);

	$raw_areas = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT id, title, shape_type, nodes, canvas_styles FROM {$wpdb->prefix}cns_map_areas WHERE map_id = %d",
			$map_id
		),
		ARRAY_A
	) ?: [];

	$areas = array_map(fn(array $a): array => [
		'id'           => (int) $a['id'],
		'title'        => $a['title'],
		'shapeType'    => $a['shape_type'],
		'nodes'        => json_decode($a['nodes'], true) ?: [],
		'canvasStyles' => $a['canvas_styles'] ? json_decode($a['canvas_styles'], true) : null,
	], $raw_areas);

	return [
		'id'          => $map_id,
		'title'       => $map->post_title,
		'width'       => $width,
		'aspectRatio' => $aspect_ratio,
		'bgType'      => $bg_type,
		'bgColor'     => $bg_color,
		'bgImageUrl'  => $bg_image_id ? (wp_get_attachment_image_url($bg_image_id, 'large') ?: '') : '',
		'imageUrl'    => $image_id    ? (wp_get_attachment_image_url($image_id, 'large')    ?: '') : '',
		'imageX'      => $image_x,
		'imageY'      => $image_y,
		'imageW'      => $image_w,
		'objects'     => $objects,
		'areas'       => $areas,
	];
}

// ── Story endpoints ───────────────────────────────────────────────────────────

function cns_story_suite_api_save_story(WP_REST_Request $req): WP_REST_Response|WP_Error {
	$story_id    = (int)    ($req->get_param('story_id')    ?? 0);
	$title       = (string) ($req->get_param('title')       ?? '');
	$status      = (string) ($req->get_param('status')      ?? 'draft');
	$map_id      = (int)    ($req->get_param('map_id')      ?? 0);
	$line_color  = (string) ($req->get_param('line_color')  ?? '#ffffff');
	$line_width  = (float)  ($req->get_param('line_width')  ?? 3.0);
	$line_style  = (string) ($req->get_param('line_style')  ?? 'solid');
	$line_opacity = (float) ($req->get_param('line_opacity') ?? 1.0);
	$start_node  = $req->get_param('start_node_id');

	$allowed_statuses = ['publish', 'draft', 'private'];
	if (! in_array($status, $allowed_statuses, true)) {
		$status = 'draft';
	}

	$allowed_styles = ['solid', 'dashed', 'dotted'];
	if (! in_array($line_style, $allowed_styles, true)) {
		$line_style = 'solid';
	}

	$post_data = [
		'post_title'  => sanitize_text_field($title),
		'post_status' => $status,
		'post_type'   => 'cns_story',
	];

	$is_new = (! $story_id);

	if ($is_new) {
		$story_id = wp_insert_post($post_data, true);
		if (is_wp_error($story_id)) {
			return $story_id;
		}
	} else {
		$story = get_post($story_id);
		if (! $story || $story->post_type !== 'cns_story') {
			return new WP_Error('not_found', __('Story not found.', 'cns-story-suite'), ['status' => 404]);
		}
		$post_data['ID'] = $story_id;
		wp_update_post($post_data);
	}

	update_post_meta($story_id, '_cns_story_map_id',        $map_id);
	update_post_meta($story_id, '_cns_story_line_color',    sanitize_hex_color($line_color) ?: '#ffffff');
	update_post_meta($story_id, '_cns_story_line_width',    max(0.5, min(20.0, $line_width)));
	update_post_meta($story_id, '_cns_story_line_style',    $line_style);
	update_post_meta($story_id, '_cns_story_line_opacity',  max(0.0, min(1.0, $line_opacity)));

	if ($start_node !== null) {
		update_post_meta($story_id, '_cns_story_start_node_id', (int) $start_node);
	}

	$editor_url = add_query_arg(
		['page' => CNS_STORY_PAGE_EDITOR, 'story_id' => $story_id],
		admin_url('admin.php')
	);

	$view_url = '';
	$story = get_post($story_id);
	if ($story && in_array($story->post_status, ['publish', 'private'], true)) {
		$view_url = (string) (get_permalink($story_id) ?: '');
	}

	return new WP_REST_Response([
		'created'    => $is_new,
		'storyId'    => $story_id,
		'editUrl'    => $editor_url,
		'viewUrl'    => $view_url,
	], 200);
}

function cns_story_suite_api_get_story_data(WP_REST_Request $req): WP_REST_Response|WP_Error {
	global $wpdb;

	$story_id = (int) $req['id'];
	$story    = get_post($story_id);

	if (! $story || $story->post_type !== 'cns_story') {
		return new WP_Error('not_found', __('Story not found.', 'cns-story-suite'), ['status' => 404]);
	}

	$map_id       = (int)    get_post_meta($story_id, '_cns_story_map_id', true);
	$line_color   = (string) (get_post_meta($story_id, '_cns_story_line_color', true)   ?: '#ffffff');
	$line_width   = (float)  (get_post_meta($story_id, '_cns_story_line_width', true)   ?: 3.0);
	$line_style   = (string) (get_post_meta($story_id, '_cns_story_line_style', true)   ?: 'solid');
	$line_opacity = (float)  (get_post_meta($story_id, '_cns_story_line_opacity', true) ?: 1.0);
	$start_node   = (int)    get_post_meta($story_id, '_cns_story_start_node_id', true);

	$raw_nodes = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}cns_story_nodes WHERE story_id = %d ORDER BY created_at ASC, id ASC",
			$story_id
		),
		ARRAY_A
	) ?: [];

	$nodes = array_map('cns_story_suite_format_node', $raw_nodes);

	$raw_edges = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}cns_story_edges WHERE story_id = %d ORDER BY sort_order ASC, id ASC",
			$story_id
		),
		ARRAY_A
	) ?: [];

	$edges = array_map('cns_story_suite_format_edge', $raw_edges);

	$map_data = $map_id ? cns_story_suite_get_map_render_data($map_id) : null;

	$view_url = in_array($story->post_status, ['publish', 'private'], true)
		? (string) (get_permalink($story_id) ?: '')
		: '';

	return new WP_REST_Response([
		'story' => [
			'id'          => $story_id,
			'title'       => $story->post_title,
			'status'      => $story->post_status,
			'mapId'       => $map_id ?: null,
			'mapTitle'    => $map_data ? $map_data['title'] : '',
			'lineColor'   => $line_color,
			'lineWidth'   => $line_width,
			'lineStyle'   => $line_style,
			'lineOpacity' => $line_opacity,
			'startNodeId' => $start_node ?: null,
			'viewUrl'     => $view_url,
		],
		'mapData' => $map_data,
		'nodes'   => $nodes,
		'edges'   => $edges,
	], 200);
}

function cns_story_suite_api_get_map_stories(WP_REST_Request $req): WP_REST_Response {
	$map_id  = (int) $req['id'];
	$stories = get_posts([
		'post_type'      => 'cns_story',
		'posts_per_page' => -1,
		'post_status'    => ['publish', 'draft', 'private'],
		'meta_query'     => [
			['key' => '_cns_story_map_id', 'value' => $map_id, 'type' => 'NUMERIC'],
		],
	]);

	$result = array_map(function (WP_Post $s): array {
		global $wpdb;
		$count = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->prefix}cns_story_nodes WHERE story_id = %d",
				$s->ID
			)
		);
		return [
			'id'         => $s->ID,
			'title'      => $s->post_title ?: __('(no title)', 'cns-story-suite'),
			'status'     => $s->post_status,
			'nodeCount'  => $count,
			'editUrl'    => add_query_arg(
				['page' => CNS_STORY_PAGE_EDITOR, 'story_id' => $s->ID],
				admin_url('admin.php')
			),
		];
	}, $stories);

	return new WP_REST_Response($result, 200);
}

// ── Node endpoints ────────────────────────────────────────────────────────────

function cns_story_suite_api_create_node(WP_REST_Request $req): WP_REST_Response|WP_Error {
	global $wpdb;

	$story_id = (int) $req['id'];
	$story    = get_post($story_id);
	if (! $story || $story->post_type !== 'cns_story') {
		return new WP_Error('not_found', __('Story not found.', 'cns-story-suite'), ['status' => 404]);
	}

	$x            = (float)  ($req->get_param('x')            ?? 0.5);
	$y            = (float)  ($req->get_param('y')            ?? 0.5);
	$icon_type    = (string) ($req->get_param('icon_type')    ?? 'round');
	$icon_id      = (int)    ($req->get_param('icon_id')      ?? 0);
	$icon_color   = (string) ($req->get_param('icon_color')   ?? '#ffffff');
	$icon_size    = (float)  ($req->get_param('icon_size')    ?? 1.0);
	$substory_id  = (int)    ($req->get_param('substory_id')  ?? 0);
	$title_ov     = $req->get_param('title_override');
	$excerpt_ov   = $req->get_param('excerpt_override');

	$allowed_icon_types = ['round', 'square', 'icon'];
	if (! in_array($icon_type, $allowed_icon_types, true)) $icon_type = 'round';

	$wpdb->insert(
		$wpdb->prefix . 'cns_story_nodes',
		[
			'story_id'        => $story_id,
			'substory_id'     => $substory_id ?: null,
			'title_override'  => $title_ov  ? sanitize_text_field($title_ov)  : null,
			'excerpt_override' => $excerpt_ov ? sanitize_textarea_field($excerpt_ov) : null,
			'x'               => max(0.0, min(1.0, $x)),
			'y'               => max(0.0, min(1.0, $y)),
			'icon_type'       => $icon_type,
			'icon_id'         => $icon_id ?: null,
			'icon_color'      => sanitize_hex_color($icon_color) ?: '#ffffff',
			'icon_size'       => max(0.25, min(4.0, $icon_size)),
		],
		['%d', '%d', '%s', '%s', '%f', '%f', '%s', '%d', '%s', '%f']
	);

	$node_id = (int) $wpdb->insert_id;
	$row     = $wpdb->get_row(
		$wpdb->prepare("SELECT * FROM {$wpdb->prefix}cns_story_nodes WHERE id = %d", $node_id),
		ARRAY_A
	);

	return new WP_REST_Response(cns_story_suite_format_node($row), 201);
}

function cns_story_suite_api_update_node(WP_REST_Request $req): WP_REST_Response|WP_Error {
	global $wpdb;

	$node_id = (int) $req['id'];
	$row     = $wpdb->get_row(
		$wpdb->prepare("SELECT * FROM {$wpdb->prefix}cns_story_nodes WHERE id = %d", $node_id),
		ARRAY_A
	);

	if (! $row) {
		return new WP_Error('not_found', __('Node not found.', 'cns-story-suite'), ['status' => 404]);
	}

	$updates = [];
	$formats = [];

	if (($v = $req->get_param('x')) !== null) {
		$updates['x'] = max(0.0, min(1.0, (float) $v));
		$formats[]    = '%f';
	}
	if (($v = $req->get_param('y')) !== null) {
		$updates['y'] = max(0.0, min(1.0, (float) $v));
		$formats[]    = '%f';
	}
	if (($v = $req->get_param('icon_type')) !== null) {
		$allowed = ['round', 'square', 'icon'];
		$updates['icon_type'] = in_array($v, $allowed, true) ? $v : 'round';
		$formats[]            = '%s';
	}
	if (($v = $req->get_param('icon_id')) !== null) {
		$updates['icon_id'] = (int) $v ?: null;
		$formats[]          = '%d';
	}
	if (($v = $req->get_param('icon_color')) !== null) {
		$updates['icon_color'] = sanitize_hex_color($v) ?: '#ffffff';
		$formats[]             = '%s';
	}
	if (($v = $req->get_param('icon_size')) !== null) {
		$updates['icon_size'] = max(0.25, min(4.0, (float) $v));
		$formats[]            = '%f';
	}
	if (($v = $req->get_param('substory_id')) !== null) {
		$updates['substory_id'] = (int) $v ?: null;
		$formats[]              = '%d';
	}
	if ($req->has_param('title_override')) {
		$v = $req->get_param('title_override');
		$updates['title_override'] = $v ? sanitize_text_field($v) : null;
		$formats[]                 = '%s';
	}
	if ($req->has_param('excerpt_override')) {
		$v = $req->get_param('excerpt_override');
		$updates['excerpt_override'] = $v ? sanitize_textarea_field($v) : null;
		$formats[]                   = '%s';
	}

	if ($updates) {
		$wpdb->update($wpdb->prefix . 'cns_story_nodes', $updates, ['id' => $node_id], $formats, ['%d']);
	}

	$updated = $wpdb->get_row(
		$wpdb->prepare("SELECT * FROM {$wpdb->prefix}cns_story_nodes WHERE id = %d", $node_id),
		ARRAY_A
	);

	return new WP_REST_Response(cns_story_suite_format_node($updated), 200);
}

function cns_story_suite_api_delete_node(WP_REST_Request $req): WP_REST_Response|WP_Error {
	global $wpdb;

	$node_id = (int) $req['id'];
	$row     = $wpdb->get_row(
		$wpdb->prepare("SELECT id FROM {$wpdb->prefix}cns_story_nodes WHERE id = %d", $node_id)
	);

	if (! $row) {
		return new WP_Error('not_found', __('Node not found.', 'cns-story-suite'), ['status' => 404]);
	}

	// Delete connected edges first.
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->prefix}cns_story_edges WHERE from_node_id = %d OR to_node_id = %d",
			$node_id,
			$node_id
		)
	);

	$wpdb->delete($wpdb->prefix . 'cns_story_nodes', ['id' => $node_id], ['%d']);

	return new WP_REST_Response(['deleted' => true, 'id' => $node_id], 200);
}

// ── Edge endpoints ────────────────────────────────────────────────────────────

function cns_story_suite_api_create_edge(WP_REST_Request $req): WP_REST_Response|WP_Error {
	global $wpdb;

	$story_id    = (int) ($req->get_param('story_id')    ?? 0);
	$from_node   = (int) ($req->get_param('from_node_id') ?? 0);
	$to_node     = (int) ($req->get_param('to_node_id')   ?? 0);
	$sort_order  = (int) ($req->get_param('sort_order')   ?? 0);

	if (! $story_id || ! $from_node || ! $to_node) {
		return new WP_Error('missing_params', __('story_id, from_node_id, and to_node_id are required.', 'cns-story-suite'), ['status' => 400]);
	}

	if ($from_node === $to_node) {
		return new WP_Error('self_loop', __('A node cannot connect to itself.', 'cns-story-suite'), ['status' => 400]);
	}

	// Check both nodes belong to this story.
	$nodes = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT id FROM {$wpdb->prefix}cns_story_nodes WHERE story_id = %d AND id IN (%d, %d)",
			$story_id, $from_node, $to_node
		)
	);
	if (count($nodes) < 2) {
		return new WP_Error('invalid_nodes', __('Both nodes must belong to this story.', 'cns-story-suite'), ['status' => 400]);
	}

	$inserted = $wpdb->insert(
		$wpdb->prefix . 'cns_story_edges',
		[
			'story_id'    => $story_id,
			'from_node_id' => $from_node,
			'to_node_id'  => $to_node,
			'sort_order'  => $sort_order,
		],
		['%d', '%d', '%d', '%d']
	);

	if ($inserted === false) {
		// Likely a duplicate — return the existing edge.
		$existing = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}cns_story_edges WHERE from_node_id = %d AND to_node_id = %d",
				$from_node, $to_node
			),
			ARRAY_A
		);
		return new WP_REST_Response(cns_story_suite_format_edge($existing), 200);
	}

	$edge_id = (int) $wpdb->insert_id;
	$edge    = $wpdb->get_row(
		$wpdb->prepare("SELECT * FROM {$wpdb->prefix}cns_story_edges WHERE id = %d", $edge_id),
		ARRAY_A
	);

	return new WP_REST_Response(cns_story_suite_format_edge($edge), 201);
}

function cns_story_suite_api_update_edge(WP_REST_Request $req): WP_REST_Response|WP_Error {
	global $wpdb;

	$edge_id = (int) $req['id'];
	$row     = $wpdb->get_row(
		$wpdb->prepare("SELECT * FROM {$wpdb->prefix}cns_story_edges WHERE id = %d", $edge_id),
		ARRAY_A
	);

	if (! $row) {
		return new WP_Error('not_found', __('Edge not found.', 'cns-story-suite'), ['status' => 404]);
	}

	if (($v = $req->get_param('sort_order')) !== null) {
		$wpdb->update(
			$wpdb->prefix . 'cns_story_edges',
			['sort_order' => (int) $v],
			['id' => $edge_id],
			['%d'],
			['%d']
		);
	}

	$updated = $wpdb->get_row(
		$wpdb->prepare("SELECT * FROM {$wpdb->prefix}cns_story_edges WHERE id = %d", $edge_id),
		ARRAY_A
	);

	return new WP_REST_Response(cns_story_suite_format_edge($updated), 200);
}

function cns_story_suite_api_delete_edge(WP_REST_Request $req): WP_REST_Response|WP_Error {
	global $wpdb;

	$edge_id = (int) $req['id'];
	$row     = $wpdb->get_row(
		$wpdb->prepare("SELECT id FROM {$wpdb->prefix}cns_story_edges WHERE id = %d", $edge_id)
	);

	if (! $row) {
		return new WP_Error('not_found', __('Edge not found.', 'cns-story-suite'), ['status' => 404]);
	}

	$wpdb->delete($wpdb->prefix . 'cns_story_edges', ['id' => $edge_id], ['%d']);

	return new WP_REST_Response(['deleted' => true, 'id' => $edge_id], 200);
}

// ── Substory endpoints ────────────────────────────────────────────────────────

function cns_story_suite_api_search_substories(WP_REST_Request $req): WP_REST_Response {
	$search   = sanitize_text_field($req->get_param('search') ?? '');
	$per_page = max(1, min(50, (int) ($req->get_param('per_page') ?? 20)));

	$query_args = [
		'post_type'      => 'cns_substory',
		'posts_per_page' => $per_page,
		'post_status'    => ['publish', 'draft', 'private'],
		'orderby'        => 'title',
		'order'          => 'ASC',
	];

	if ($search) {
		$query_args['s'] = $search;
	}

	$posts  = get_posts($query_args);
	$result = array_map(function (WP_Post $p): array {
		$thumb_id = (int) get_post_thumbnail_id($p->ID);
		return [
			'id'           => $p->ID,
			'title'        => $p->post_title ?: __('(no title)', 'cns-story-suite'),
			'excerpt'      => $p->post_excerpt,
			'status'       => $p->post_status,
			'thumbnailUrl' => $thumb_id ? (wp_get_attachment_image_url($thumb_id, 'thumbnail') ?: '') : '',
			'editUrl'      => (string) (get_edit_post_link($p->ID, 'raw') ?: ''),
		];
	}, $posts);

	return new WP_REST_Response($result, 200);
}

function cns_story_suite_api_create_substory(WP_REST_Request $req): WP_REST_Response|WP_Error {
	$title   = sanitize_text_field($req->get_param('title')   ?? '');
	$content = wp_kses_post($req->get_param('content')        ?? '');
	$excerpt = sanitize_textarea_field($req->get_param('excerpt') ?? '');

	$post_id = wp_insert_post([
		'post_type'    => 'cns_substory',
		'post_title'   => $title,
		'post_content' => $content,
		'post_excerpt' => $excerpt,
		'post_status'  => 'draft',
	], true);

	if (is_wp_error($post_id)) {
		return $post_id;
	}

	return new WP_REST_Response([
		'id'      => $post_id,
		'title'   => $title ?: __('(no title)', 'cns-story-suite'),
		'editUrl' => (string) (get_edit_post_link($post_id, 'raw') ?: ''),
	], 201);
}

// ── Link endpoints ────────────────────────────────────────────────────────────

function cns_story_suite_api_get_links(WP_REST_Request $req): WP_REST_Response|WP_Error {
	global $wpdb;

	$story_id = (int) $req['id'];
	$story    = get_post($story_id);
	if (! $story || $story->post_type !== 'cns_story') {
		return new WP_Error('not_found', __('Story not found.', 'cns-story-suite'), ['status' => 404]);
	}

	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}cns_story_links WHERE story_id = %d ORDER BY id ASC",
			$story_id
		),
		ARRAY_A
	) ?: [];

	$result = array_map(fn(array $row): array => [
		'id'        => (int) $row['id'],
		'storyId'   => (int) $row['story_id'],
		'linkType'  => $row['link_type'],
		'linkId'    => (int) $row['link_id'],
		'linkTitle' => cns_story_suite_resolve_link_title($row['link_type'], (int) $row['link_id']),
	], $rows);

	return new WP_REST_Response($result, 200);
}

function cns_story_suite_api_create_link(WP_REST_Request $req): WP_REST_Response|WP_Error {
	global $wpdb;

	$story_id  = (int)    $req['id'];
	$link_type = (string) ($req->get_param('link_type') ?? '');
	$link_id   = (int)    ($req->get_param('link_id')   ?? 0);

	$allowed_types = ['map_object', 'map_area', 'hierarchy'];
	if (! in_array($link_type, $allowed_types, true)) {
		return new WP_Error('invalid_type', __('link_type must be map_object, map_area, or hierarchy.', 'cns-story-suite'), ['status' => 400]);
	}

	if (! $link_id) {
		return new WP_Error('missing_link_id', __('link_id is required.', 'cns-story-suite'), ['status' => 400]);
	}

	$story = get_post($story_id);
	if (! $story || $story->post_type !== 'cns_story') {
		return new WP_Error('not_found', __('Story not found.', 'cns-story-suite'), ['status' => 404]);
	}

	$wpdb->insert(
		$wpdb->prefix . 'cns_story_links',
		['story_id' => $story_id, 'link_type' => $link_type, 'link_id' => $link_id],
		['%d', '%s', '%d']
	);

	$insert_id = (int) $wpdb->insert_id;

	if (! $insert_id) {
		// Duplicate unique key — fetch existing.
		$existing = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}cns_story_links WHERE story_id = %d AND link_type = %s AND link_id = %d",
				$story_id, $link_type, $link_id
			),
			ARRAY_A
		);
		return new WP_REST_Response([
			'id'        => (int) $existing['id'],
			'storyId'   => $story_id,
			'linkType'  => $link_type,
			'linkId'    => $link_id,
			'linkTitle' => cns_story_suite_resolve_link_title($link_type, $link_id),
		], 200);
	}

	return new WP_REST_Response([
		'id'        => $insert_id,
		'storyId'   => $story_id,
		'linkType'  => $link_type,
		'linkId'    => $link_id,
		'linkTitle' => cns_story_suite_resolve_link_title($link_type, $link_id),
	], 201);
}

function cns_story_suite_api_delete_link(WP_REST_Request $req): WP_REST_Response|WP_Error {
	global $wpdb;

	$link_id = (int) $req['id'];
	$row     = $wpdb->get_row(
		$wpdb->prepare("SELECT id FROM {$wpdb->prefix}cns_story_links WHERE id = %d", $link_id)
	);

	if (! $row) {
		return new WP_Error('not_found', __('Link not found.', 'cns-story-suite'), ['status' => 404]);
	}

	$wpdb->delete($wpdb->prefix . 'cns_story_links', ['id' => $link_id], ['%d']);

	return new WP_REST_Response(['deleted' => true, 'id' => $link_id], 200);
}

function cns_story_suite_resolve_link_title(string $link_type, int $link_id): string {
	global $wpdb;
	switch ($link_type) {
		case 'map_object':
			$row = $wpdb->get_row(
				$wpdb->prepare("SELECT title FROM {$wpdb->prefix}cns_map_objects WHERE id = %d", $link_id)
			);
			return $row ? $row->title : '';

		case 'map_area':
			$row = $wpdb->get_row(
				$wpdb->prepare("SELECT title FROM {$wpdb->prefix}cns_map_areas WHERE id = %d", $link_id)
			);
			return $row ? $row->title : '';

		case 'hierarchy':
			$row = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT p.post_title FROM {$wpdb->prefix}cns_map_hierarchy h
					 LEFT JOIN {$wpdb->posts} p ON p.ID = h.child_map_id
					 WHERE h.id = %d",
					$link_id
				)
			);
			return $row ? $row->post_title : '';

		default:
			return '';
	}
}
