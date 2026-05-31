<?php

/**
 * Runs when the plugin is deleted from the WordPress admin.
 *
 * Always removes:
 *  - Custom DB tables (story_nodes, story_edges, story_links)
 *  - Plugin options
 *  - manage_stories capability from all roles
 *
 * Conditionally removes (requires opt-in):
 *  - All cns_story and cns_substory posts and their meta
 */

defined('WP_UNINSTALL_PLUGIN') || exit;

global $wpdb;

$tables = [
	$wpdb->prefix . 'cns_story_links',
	$wpdb->prefix . 'cns_story_edges',
	$wpdb->prefix . 'cns_story_nodes',
];

foreach ($tables as $table) {
	// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	$wpdb->query("DROP TABLE IF EXISTS {$table}");
}

if (get_option('cns_story_suite_delete_on_uninstall')) {
	foreach (['cns_story', 'cns_substory'] as $post_type) {
		$ids = get_posts([
			'post_type'      => $post_type,
			'posts_per_page' => -1,
			'post_status'    => 'any',
			'fields'         => 'ids',
		]);
		foreach ($ids as $id) {
			wp_delete_post((int) $id, true);
		}
	}
}

delete_option('cns_story_suite_db_version');
delete_option('cns_story_suite_delete_on_uninstall');

foreach (wp_roles()->roles as $role_name => $unused) {
	$role = get_role($role_name);
	if ($role && $role->has_cap('manage_stories')) {
		$role->remove_cap('manage_stories');
	}
}
