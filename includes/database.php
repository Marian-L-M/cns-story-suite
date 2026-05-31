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

	// Story nodes: one row per canvas node, optionally linked to a substory post.
	dbDelta("CREATE TABLE {$wpdb->prefix}cns_story_nodes (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		story_id BIGINT UNSIGNED NOT NULL,
		substory_id BIGINT UNSIGNED NULL DEFAULT NULL,
		title_override VARCHAR(255) NULL DEFAULT NULL,
		excerpt_override TEXT NULL DEFAULT NULL,
		x FLOAT NOT NULL DEFAULT 0.5,
		y FLOAT NOT NULL DEFAULT 0.5,
		icon_type VARCHAR(10) NOT NULL DEFAULT 'round',
		icon_id BIGINT UNSIGNED NULL DEFAULT NULL,
		icon_color VARCHAR(7) NOT NULL DEFAULT '#ffffff',
		icon_size FLOAT NOT NULL DEFAULT 1.0,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY idx_story_id (story_id),
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
