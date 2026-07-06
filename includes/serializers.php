<?php

defined('ABSPATH') || exit;

/**
 * Row serializers shared by the REST API (admin editor) and the frontend
 * story block. One source of truth; `$public` controls what the anonymous
 * frontend may see (no edit URLs, unpublished substories gated by read_post).
 */

function cns_story_suite_resolve_icon_url(int $icon_id): string {
	if (! $icon_id) return '';
	// Map-suite icons are regular WP attachments (tagged with _cns_map_icon meta),
	// so the attachment URL is the canonical source.
	return (string) (wp_get_attachment_url($icon_id) ?: '');
}

function cns_story_suite_serialize_node(array $row, bool $public = false): array {
	$node = ['id' => (int) $row['id']];

	if (! $public) {
		$node['storyId'] = (int) $row['story_id'];
	}

	$node += [
		'pathId'           => !empty($row['path_id']) ? (int) $row['path_id'] : null,
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
		'iconBorderColor'  => $row['icon_border_color'] ?? '#000000',
		'iconBorderWidth'  => (float) ($row['icon_border_width'] ?? 2.0),
		'iconBgColor'      => $row['icon_bg_color'] ?? '#ffffff',
		'iconBgShape'      => $row['icon_bg_shape'] ?? 'none',
		'markerType'       => $row['marker_type'] ?? 'inherit',
		'markerIconId'     => !empty($row['marker_icon_id']) ? (int) $row['marker_icon_id'] : null,
		'markerIconUrl'    => !empty($row['marker_icon_id']) ? cns_story_suite_resolve_icon_url((int) $row['marker_icon_id']) : null,
		'markerColor'      => isset($row['marker_color'])        ? ($row['marker_color'] ?: null) : null,
		'markerSize'       => isset($row['marker_size'])         ? ($row['marker_size'] !== null ? (float) $row['marker_size'] : null) : null,
		'markerIconOffsetX' => isset($row['marker_icon_offset_x']) ? ($row['marker_icon_offset_x'] !== null ? (float) $row['marker_icon_offset_x'] : null) : null,
		'markerIconOffsetY' => isset($row['marker_icon_offset_y']) ? ($row['marker_icon_offset_y'] !== null ? (float) $row['marker_icon_offset_y'] : null) : null,
	];

	if (! $public) {
		$node['createdAt'] = $row['created_at'];
	}

	$node += [
		'substoryTitle'        => null,
		'substoryExcerpt'      => null,
		'substoryThumbnailUrl' => null,
		'substoryUrl'          => null,
	];
	if (! $public) {
		$node['substoryEditUrl'] = null;
	}

	if ($row['substory_id']) {
		$sub = get_post((int) $row['substory_id']);
		// Unpublished substories are only surfaced to users allowed to read
		// them; the admin editor ($public = false) always sees them.
		$sub_visible = $sub
			&& $sub->post_type === 'cns_substory'
			&& (! $public || $sub->post_status === 'publish' || current_user_can('read_post', $sub->ID));
		if ($sub_visible) {
			$node['substoryTitle']   = $sub->post_title;
			$node['substoryExcerpt'] = $sub->post_excerpt ?: wp_trim_excerpt('', $sub);
			$thumb_id = (int) get_post_thumbnail_id($sub->ID);
			$node['substoryThumbnailUrl'] = $thumb_id
				? (wp_get_attachment_image_url($thumb_id, 'medium') ?: null)
				: null;
			// Permalinks only for statuses that resolve to a viewable page.
			$node['substoryUrl'] = in_array($sub->post_status, ['publish', 'private'], true)
				? (get_permalink($sub->ID) ?: null)
				: null;
			if (! $public) {
				$node['substoryEditUrl'] = get_edit_post_link($sub->ID, 'raw');
			}
		}
	}

	return $node;
}

function cns_story_suite_serialize_path(array $row, bool $public = false): array {
	$icon_url = !empty($row['marker_icon_id'])
		? (wp_get_attachment_url((int) $row['marker_icon_id']) ?: '')
		: '';

	$path = ['id' => (int) $row['id']];
	if (! $public) {
		$path += [
			'storyId'   => (int) $row['story_id'],
			'label'     => $row['label'],
			'sortOrder' => (int) $row['sort_order'],
		];
	}
	$path += [
		'markerColor' => $row['marker_color'],
		'markerSize'  => (float) $row['marker_size'],
		'markerType'  => $row['marker_type'],
	];
	if (! $public) {
		$path['markerIconId'] = !empty($row['marker_icon_id']) ? (int) $row['marker_icon_id'] : null;
	}
	$path += [
		'markerIconUrl'     => $icon_url,
		'markerIconOffsetX' => (float) ($row['marker_icon_offset_x'] ?? 0.0),
		'markerIconOffsetY' => (float) ($row['marker_icon_offset_y'] ?? -30.0),
	];

	return $path;
}

/**
 * Warms the post caches for every post a set of node rows references
 * (substories, icons, marker icons) so serialization doesn't query per row.
 */
function cns_story_suite_prime_node_caches(array $rows): void {
	$ids = [];
	foreach ($rows as $row) {
		foreach (['substory_id', 'icon_id', 'marker_icon_id'] as $key) {
			if (! empty($row[$key])) {
				$ids[] = (int) $row[$key];
			}
		}
	}
	if ($ids) {
		_prime_post_caches(array_unique($ids), false, true);
	}
}
