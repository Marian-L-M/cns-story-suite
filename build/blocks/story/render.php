<?php
/**
 * Server-side render for cns-story-suite/story block.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block content (unused; dynamic block).
 * @var WP_Block $block      Block instance.
 */

defined('ABSPATH') || exit;

$story_id = (int) ($attributes['storyId'] ?? 0);
if (! $story_id) {
	return '';
}

$story = get_post($story_id);
if (! $story || $story->post_type !== 'cns_story') {
	return '';
}

global $wpdb;

$map_id           = (int)    get_post_meta($story_id, '_cns_story_map_id', true);
$line_color       = (string) (get_post_meta($story_id, '_cns_story_line_color', true)   ?: '#ffffff');
$line_width       = (float)  (get_post_meta($story_id, '_cns_story_line_width', true)   ?: 3.0);
$line_style       = (string) (get_post_meta($story_id, '_cns_story_line_style', true)   ?: 'solid');
$line_opacity     = (float)  (get_post_meta($story_id, '_cns_story_line_opacity', true) ?: 1.0);
$start_node       = (int)    get_post_meta($story_id, '_cns_story_start_node_id', true);
$marker_color     = (string) (get_post_meta($story_id, '_cns_story_marker_color', true)          ?: '#00aaff');
$marker_size      = (float)  (get_post_meta($story_id, '_cns_story_marker_size', true)           ?: 5.0);
$marker_type      = (string) (get_post_meta($story_id, '_cns_story_marker_type', true)           ?: 'ring');
$marker_icon_id   = (int)    get_post_meta($story_id, '_cns_story_marker_icon_id', true);
$marker_icon_url  = $marker_icon_id ? (wp_get_attachment_url($marker_icon_id) ?: '') : '';
$legacy_off       = (float)  (get_post_meta($story_id, '_cns_story_marker_icon_offset', true) ?: 0.0);
$off_x_raw        = get_post_meta($story_id, '_cns_story_marker_icon_offset_x', true);
$off_y_raw        = get_post_meta($story_id, '_cns_story_marker_icon_offset_y', true);
$marker_off_x     = ($off_x_raw !== '' && $off_x_raw !== false) ? (float) $off_x_raw : 0.0;
$marker_off_y     = ($off_y_raw !== '' && $off_y_raw !== false) ? (float) $off_y_raw : ($legacy_off ?: -30.0);

$raw_nodes = $wpdb->get_results(
	$wpdb->prepare(
		"SELECT * FROM {$wpdb->prefix}cns_story_nodes WHERE story_id = %d ORDER BY created_at ASC, id ASC",
		$story_id
	),
	ARRAY_A
) ?: [];

$raw_paths = $wpdb->get_results(
	$wpdb->prepare(
		"SELECT * FROM {$wpdb->prefix}cns_story_paths WHERE story_id = %d ORDER BY sort_order ASC, id ASC",
		$story_id
	),
	ARRAY_A
) ?: [];

$paths = array_map(function (array $r): array {
	$icon_url = !empty($r['marker_icon_id'])
		? (wp_get_attachment_url((int) $r['marker_icon_id']) ?: '')
		: '';
	return [
		'id'                => (int) $r['id'],
		'markerColor'       => $r['marker_color'],
		'markerSize'        => (float) $r['marker_size'],
		'markerType'        => $r['marker_type'],
		'markerIconUrl'     => $icon_url,
		'markerIconOffsetX' => (float) ($r['marker_icon_offset_x'] ?? 0.0),
		'markerIconOffsetY' => (float) ($r['marker_icon_offset_y'] ?? -30.0),
	];
}, $raw_paths);

$paths_by_id = [];
foreach ($paths as $p) { $paths_by_id[$p['id']] = $p; }

$nodes = array_map(function (array $row) use ($paths_by_id): array {
	$node = [
		'id'               => (int) $row['id'],
		'pathId'           => !empty($row['path_id']) ? (int) $row['path_id'] : null,
		'substoryId'       => $row['substory_id'] ? (int) $row['substory_id'] : null,
		'titleOverride'    => $row['title_override'],
		'excerptOverride'  => $row['excerpt_override'],
		'x'                => (float) $row['x'],
		'y'                => (float) $row['y'],
		'iconType'         => $row['icon_type'],
		'iconId'           => $row['icon_id'] ? (int) $row['icon_id'] : null,
		'iconUrl'          => null,
		'iconColor'        => $row['icon_color'],
		'iconSize'         => (float) $row['icon_size'],
		'iconBorderColor'  => $row['icon_border_color'] ?? '#000000',
		'iconBorderWidth'  => (float) ($row['icon_border_width'] ?? 2.0),
		'iconBgColor'      => $row['icon_bg_color'] ?? '#ffffff',
		'iconBgShape'      => $row['icon_bg_shape'] ?? 'none',
		'markerType'       => $row['marker_type'] ?? 'inherit',
		'markerIconId'     => !empty($row['marker_icon_id']) ? (int) $row['marker_icon_id'] : null,
		'markerIconUrl'    => null,
		'markerColor'      => isset($row['marker_color'])        ? ($row['marker_color'] ?: null) : null,
		'markerSize'       => isset($row['marker_size'])         ? ($row['marker_size'] !== null ? (float) $row['marker_size'] : null) : null,
		'markerIconOffsetX' => isset($row['marker_icon_offset_x']) ? ($row['marker_icon_offset_x'] !== null ? (float) $row['marker_icon_offset_x'] : null) : null,
		'markerIconOffsetY' => isset($row['marker_icon_offset_y']) ? ($row['marker_icon_offset_y'] !== null ? (float) $row['marker_icon_offset_y'] : null) : null,
		'substoryTitle'    => null,
		'substoryExcerpt'  => null,
		'substoryThumbnailUrl' => null,
		'substoryUrl'      => null,
	];

	if ($row['icon_id']) {
		$node['iconUrl'] = (string) (wp_get_attachment_url((int) $row['icon_id']) ?: '');
	}

	if (!empty($row['marker_icon_id'])) {
		$node['markerIconUrl'] = (string) (wp_get_attachment_url((int) $row['marker_icon_id']) ?: null);
	}

	if ($row['substory_id']) {
		$sub = get_post((int) $row['substory_id']);
		if ($sub && $sub->post_type === 'cns_substory') {
			$node['substoryTitle']   = $sub->post_title;
			$node['substoryExcerpt'] = $sub->post_excerpt ?: wp_trim_excerpt('', $sub);
			$thumb_id = (int) get_post_thumbnail_id($sub->ID);
			$node['substoryThumbnailUrl'] = $thumb_id
				? (wp_get_attachment_image_url($thumb_id, 'medium') ?: null)
				: null;
			$node['substoryUrl'] = get_permalink($sub->ID) ?: null;
		}
	}

	return $node;
}, $raw_nodes);

$raw_edges = $wpdb->get_results(
	$wpdb->prepare(
		"SELECT * FROM {$wpdb->prefix}cns_story_edges WHERE story_id = %d ORDER BY sort_order ASC, id ASC",
		$story_id
	),
	ARRAY_A
) ?: [];

$edges = array_map(fn(array $e): array => [
	'id'          => (int) $e['id'],
	'fromNodeId'  => (int) $e['from_node_id'],
	'toNodeId'    => (int) $e['to_node_id'],
	'sortOrder'   => (int) $e['sort_order'],
	'lineColor'   => $e['line_color'] ?? null,
	'lineWidth'   => isset($e['line_width'])   ? (float) $e['line_width']   : null,
	'lineStyle'   => $e['line_style']  ?? null,
	'lineOpacity' => isset($e['line_opacity']) ? (float) $e['line_opacity'] : null,
], $raw_edges);

// Map render data.
$map_data = null;
if ($map_id && function_exists('cns_story_suite_get_map_render_data')) {
	$map_data = cns_story_suite_get_map_render_data($map_id);
}

// Enrich map objects and areas with infobox data for frontend click handlers.
if ($map_data && $map_id) {
	$resolve = static function (array $row): array {
		if (($row['infobox_source'] ?? '') === 'post' && !empty($row['linked_post_id'])) {
			$linked = get_post((int) $row['linked_post_id']);
			if ($linked) {
				return [
					'title'    => $linked->post_title,
					'content'  => function_exists('cns_map_suite_infobox_content')
						? cns_map_suite_infobox_content($linked)
						: wp_trim_excerpt('', $linked),
					'imageUrl' => get_the_post_thumbnail_url($linked->ID, 'medium') ?: '',
					'postUrl'  => get_permalink($linked) ?: '',
				];
			}
		}
		$ib = [];
		if (!empty($row['infobox_data'])) {
			$ib = is_array($row['infobox_data']) ? $row['infobox_data'] : (json_decode($row['infobox_data'], true) ?: []);
		}
		return [
			'title'    => $ib['title']       ?? '',
			'content'  => $ib['description'] ?? '',
			'imageUrl' => !empty($ib['image_id']) ? (wp_get_attachment_image_url((int) $ib['image_id'], 'medium') ?: '') : '',
			'postUrl'  => '',
		];
	};

	// Fetch full infobox columns for objects.
	$raw_obj_ib = $wpdb->get_results(
		$wpdb->prepare("SELECT id, infobox_source, infobox_data, linked_post_id FROM {$wpdb->prefix}cns_map_objects WHERE map_id = %d", $map_id),
		ARRAY_A
	) ?: [];
	$obj_ib = [];
	foreach ($raw_obj_ib as $r) { $obj_ib[(int) $r['id']] = $r; }

	foreach ($map_data['objects'] as &$obj) {
		$row = $obj_ib[$obj['id']] ?? [];
		$resolved = $row ? $resolve($row) : ['title' => '', 'content' => '', 'imageUrl' => '', 'postUrl' => ''];
		if ($resolved['title'] || $resolved['content'] || $resolved['imageUrl']) {
			$obj['infoboxResolved'] = $resolved;
		}
	}
	unset($obj);

	// Fetch full infobox columns for areas.
	$raw_area_ib = $wpdb->get_results(
		$wpdb->prepare("SELECT id, infobox_source, infobox_data, linked_post_id FROM {$wpdb->prefix}cns_map_areas WHERE map_id = %d", $map_id),
		ARRAY_A
	) ?: [];
	$area_ib = [];
	foreach ($raw_area_ib as $r) { $area_ib[(int) $r['id']] = $r; }

	foreach ($map_data['areas'] as &$area) {
		$row = $area_ib[$area['id']] ?? [];
		$resolved = $row ? $resolve($row) : ['title' => '', 'content' => '', 'imageUrl' => '', 'postUrl' => ''];
		if ($resolved['title'] || $resolved['content'] || $resolved['imageUrl']) {
			$area['infoboxResolved'] = $resolved;
		}
	}
	unset($area);
}

$block_data = [
	'story' => [
		'id'                => $story_id,
		'lineColor'         => $line_color,
		'lineWidth'         => $line_width,
		'lineStyle'         => $line_style,
		'lineOpacity'       => $line_opacity,
		'startNodeId'       => $start_node ?: null,
		'markerColor'       => $marker_color,
		'markerSize'        => $marker_size,
		'markerType'        => $marker_type,
		'markerIconUrl'     => $marker_icon_url,
		'markerIconOffsetX' => $marker_off_x,
		'markerIconOffsetY' => $marker_off_y,
	],
	'mapData' => $map_data,
	'paths'   => $paths,
	'nodes'   => $nodes,
	'edges'   => $edges,
];

$wrapper_attributes = get_block_wrapper_attributes(['class' => 'cns-story-block']);
?>
<div <?php echo $wrapper_attributes; ?> data-story-data="<?php echo esc_attr(wp_json_encode($block_data)); ?>">
	<div class="cns-story-block__canvas-wrap">
		<canvas class="cns-story-canvas"></canvas>
	</div>
	<div class="cns-story-window"></div>
</div>
