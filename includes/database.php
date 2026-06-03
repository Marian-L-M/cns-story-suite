<?php

defined('ABSPATH') || exit;

/**
 * DB query standard: all SELECT / INSERT / UPDATE / DELETE against custom tables
 * must use $wpdb->prepare() for any value derived from user input or external data.
 */
function cns_story_suite_create_tables(): void {
	global $wpdb;

	$charset_collate = $wpdb->get_charset_collate();

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';

	// Story paths: named node groups with shared marker settings.
	dbDelta("CREATE TABLE {$wpdb->prefix}cns_story_paths (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		story_id BIGINT UNSIGNED NOT NULL,
		label VARCHAR(255) NOT NULL DEFAULT '',
		sort_order INT NOT NULL DEFAULT 0,
		marker_color VARCHAR(7) NOT NULL DEFAULT '#00aaff',
		marker_size FLOAT NOT NULL DEFAULT 5.0,
		marker_type VARCHAR(10) NOT NULL DEFAULT 'ring',
		marker_icon_id BIGINT UNSIGNED NULL DEFAULT NULL,
		marker_icon_offset_x FLOAT NOT NULL DEFAULT 0.0,
		marker_icon_offset_y FLOAT NOT NULL DEFAULT -30.0,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY idx_story_id (story_id)
	) $charset_collate;");

	// Story nodes: one row per canvas node, optionally linked to a substory post.
	dbDelta("CREATE TABLE {$wpdb->prefix}cns_story_nodes (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		story_id BIGINT UNSIGNED NOT NULL,
		path_id BIGINT UNSIGNED NULL DEFAULT NULL,
		substory_id BIGINT UNSIGNED NULL DEFAULT NULL,
		title_override VARCHAR(255) NULL DEFAULT NULL,
		excerpt_override TEXT NULL DEFAULT NULL,
		x FLOAT NOT NULL DEFAULT 0.5,
		y FLOAT NOT NULL DEFAULT 0.5,
		icon_type VARCHAR(10) NOT NULL DEFAULT 'round',
		icon_id BIGINT UNSIGNED NULL DEFAULT NULL,
		icon_color VARCHAR(7) NOT NULL DEFAULT '#ffffff',
		icon_size FLOAT NOT NULL DEFAULT 1.0,
		icon_border_color VARCHAR(7) NOT NULL DEFAULT '#000000',
		icon_border_width FLOAT NOT NULL DEFAULT 2.0,
		icon_bg_color VARCHAR(7) NOT NULL DEFAULT '#ffffff',
		icon_bg_shape VARCHAR(10) NOT NULL DEFAULT 'none',
		marker_type VARCHAR(10) NOT NULL DEFAULT 'inherit',
		marker_icon_id BIGINT UNSIGNED NULL DEFAULT NULL,
		marker_color VARCHAR(7) NULL DEFAULT NULL,
		marker_size FLOAT NULL DEFAULT NULL,
		marker_icon_offset_x FLOAT NULL DEFAULT NULL,
		marker_icon_offset_y FLOAT NULL DEFAULT NULL,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY idx_story_id (story_id),
		KEY idx_path_id (path_id),
		KEY idx_substory_id (substory_id)
	) $charset_collate;");

	// Story edges: directed graph connections between nodes.
	// sort_order controls navigation priority at branch points (lower = first).
	dbDelta("CREATE TABLE {$wpdb->prefix}cns_story_edges (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		story_id BIGINT UNSIGNED NOT NULL,
		from_node_id BIGINT UNSIGNED NOT NULL,
		to_node_id BIGINT UNSIGNED NOT NULL,
		sort_order INT NOT NULL DEFAULT 0,
		line_color VARCHAR(7) NULL DEFAULT NULL,
		line_width FLOAT NULL DEFAULT NULL,
		line_style VARCHAR(10) NULL DEFAULT NULL,
		line_opacity FLOAT NULL DEFAULT NULL,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		UNIQUE KEY uq_edge (from_node_id, to_node_id),
		KEY idx_story_id (story_id),
		KEY idx_from_node (from_node_id),
		KEY idx_to_node (to_node_id)
	) $charset_collate;");

	// Story links: relationship between a story and map-suite entities.
	dbDelta("CREATE TABLE {$wpdb->prefix}cns_story_links (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		story_id BIGINT UNSIGNED NOT NULL,
		link_type VARCHAR(20) NOT NULL,
		link_id BIGINT UNSIGNED NOT NULL,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		UNIQUE KEY uq_story_link (story_id, link_type, link_id),
		KEY idx_story_id (story_id),
		KEY idx_link (link_type, link_id)
	) $charset_collate;");
}
