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

// Respect post status: private requires read_private_posts; draft/pending only
// visible to story managers. Mirrors the gate in cns-map-suite's map render.php.
if ($story->post_status === 'private' && ! current_user_can('read_private_posts')) {
	return '';
}
if (! in_array($story->post_status, ['publish', 'private'], true) && ! current_user_can('manage_stories')) {
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

// Row shaping is shared with the REST API (includes/serializers.php);
// $public = true gates unpublished substories and omits edit URLs.
$paths = array_map(
	fn(array $r): array => cns_story_suite_serialize_path($r, true),
	$raw_paths
);

cns_story_suite_prime_node_caches($raw_nodes);

$nodes = array_map(
	fn(array $row): array => cns_story_suite_serialize_node($row, true),
	$raw_nodes
);

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

// Map render data, with infoboxes resolved for the frontend click handlers.
// All map access goes through map-suite's public API (via the adapter in api.php).
$map_data = null;
if ($map_id && function_exists('cns_story_suite_get_map_render_data')) {
	$map_data = cns_story_suite_get_map_render_data($map_id, true);
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
