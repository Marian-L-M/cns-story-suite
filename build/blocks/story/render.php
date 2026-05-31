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

$nodes = array_map(function (array $row): array {
	$node = [
		'id'               => (int) $row['id'],
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
		'substoryTitle'    => null,
		'substoryExcerpt'  => null,
		'substoryThumbnailUrl' => null,
		'substoryUrl'      => null,
	];

	if ($row['icon_id']) {
		$node['iconUrl'] = (string) (wp_get_attachment_url((int) $row['icon_id']) ?: '');
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
], $raw_edges);

// Map render data.
$map_data = null;
if ($map_id && function_exists('cns_story_suite_get_map_render_data')) {
	$map_data = cns_story_suite_get_map_render_data($map_id);
}

$block_data = [
	'story' => [
		'id'          => $story_id,
		'lineColor'   => $line_color,
		'lineWidth'   => $line_width,
		'lineStyle'   => $line_style,
		'lineOpacity' => $line_opacity,
		'startNodeId' => $start_node ?: null,
	],
	'mapData' => $map_data,
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
