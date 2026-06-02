<?php

/**
 * Plugin Name:       CNS Story Suite
 * Description:       Canvas-based branching stories for the Clouds and Spaceships platform. Requires CNS Map Suite.
 * Version:           0.1.0
 * Requires at least: 6.8
 * Requires PHP:      8.0
 * Author:            Marian Maschke
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       cns-story-suite
 *
 * @package CNS Story Suite
 */

if (! defined('ABSPATH')) {
	exit;
}

define('CNS_STORY_SUITE_VERSION',    '0.1.0');
define('CNS_STORY_SUITE_DB_VERSION', '1.1.0');
define('CNS_STORY_SUITE_DIR',        plugin_dir_path(__FILE__));
define('CNS_STORY_SUITE_URL',        plugin_dir_url(__FILE__));
define('CNS_STORY_SUITE_BASENAME',   plugin_basename(__FILE__));

define('CNS_STORY_PAGE_STORIES',    'cns-stories');
define('CNS_STORY_PAGE_EDITOR',     'cns-story-editor');
define('CNS_STORY_PAGE_SETTINGS',   'cns-settings-stories');
define('CNS_STORY_PAGE_SUBSTORIES', 'cns-substories');

// ── Lifecycle hooks (defined before dependency bail so activation can deactivate us) ──

function cns_story_suite_activate(): void {
	require_once ABSPATH . 'wp-admin/includes/plugin.php';
	if (! is_plugin_active('cns-map-suite/cns-map-suite.php')) {
		deactivate_plugins(CNS_STORY_SUITE_BASENAME);
		wp_die(
			esc_html__('CNS Story Suite requires CNS Map Suite to be installed and active.', 'cns-story-suite'),
			'',
			['back_link' => true]
		);
	}
	require_once CNS_STORY_SUITE_DIR . 'includes/capabilities.php';
	require_once CNS_STORY_SUITE_DIR . 'includes/post-types.php';
	require_once CNS_STORY_SUITE_DIR . 'includes/database.php';
	cns_story_suite_add_capabilities();
	cns_story_suite_register_post_types();
	cns_story_suite_create_tables();
	update_option('cns_story_suite_db_version', CNS_STORY_SUITE_DB_VERSION, false);
	flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'cns_story_suite_activate');

function cns_story_suite_deactivate(): void {
	if (post_type_exists('cns_story'))   unregister_post_type('cns_story');
	if (post_type_exists('cns_substory')) unregister_post_type('cns_substory');
	flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'cns_story_suite_deactivate');

// ── Runtime dependency check ──────────────────────────────────────────────────

if (! defined('CNS_MAP_SUITE_VERSION')) {
	add_action('admin_notices', function (): void {
		echo '<div class="notice notice-error"><p>' .
			esc_html__('CNS Story Suite requires CNS Map Suite to be installed and active.', 'cns-story-suite') .
			'</p></div>';
	});
	return;
}

// ── Core includes ─────────────────────────────────────────────────────────────

require_once CNS_STORY_SUITE_DIR . 'includes/capabilities.php';
require_once CNS_STORY_SUITE_DIR . 'includes/post-types.php';
require_once CNS_STORY_SUITE_DIR . 'includes/database.php';
require_once CNS_STORY_SUITE_DIR . 'includes/admin/menu.php';
require_once CNS_STORY_SUITE_DIR . 'includes/admin/api.php';

// ── Internationalisation ──────────────────────────────────────────────────────

function cns_story_suite_load_textdomain(): void {
	load_plugin_textdomain(
		'cns-story-suite',
		false,
		dirname(CNS_STORY_SUITE_BASENAME) . '/languages'
	);
}
add_action('init', 'cns_story_suite_load_textdomain');

// ── Block registration ────────────────────────────────────────────────────────

function cns_story_suite_register_blocks(): void {
	if (file_exists(__DIR__ . '/build/blocks-manifest.php')) {
		wp_register_block_types_from_metadata_collection(
			__DIR__ . '/build/blocks',
			__DIR__ . '/build/blocks-manifest.php'
		);
	} elseif (defined('WP_DEBUG') && WP_DEBUG) {
		trigger_error('CNS Story Suite: block manifest not found — run `npm run build`.', E_USER_NOTICE);
	}
}
add_action('init', 'cns_story_suite_register_blocks');

// ── DB upgrades ───────────────────────────────────────────────────────────────

function cns_story_suite_maybe_upgrade_db(): void {
	if (get_option('cns_story_suite_db_version') !== CNS_STORY_SUITE_DB_VERSION) {
		cns_story_suite_create_tables();
		update_option('cns_story_suite_db_version', CNS_STORY_SUITE_DB_VERSION, false);
	}
}
add_action('plugins_loaded', 'cns_story_suite_maybe_upgrade_db');

// ── Map suite integration ─────────────────────────────────────────────────────

add_filter('cns_map_editor_extensions', function (array $ext): array {
	$overview_url = add_query_arg(
		['page' => get_template() === 'clouds-and-spaceships' ? CNS_STORY_PAGE_SETTINGS : CNS_STORY_PAGE_STORIES],
		admin_url('admin.php')
	);
	$ext['hasStorySuite']         = true;
	$ext['storySuiteOverviewUrl'] = $overview_url;
	return $ext;
});

add_action('cns_map_suite_editor_enqueue_assets', function (): void {
	$asset_file = CNS_STORY_SUITE_DIR . 'build/map-panel/index.asset.php';
	$asset      = file_exists($asset_file)
		? require $asset_file
		: ['dependencies' => [], 'version' => CNS_STORY_SUITE_VERSION];

	wp_enqueue_script(
		'cns-story-map-panel',
		CNS_STORY_SUITE_URL . 'build/map-panel/index.js',
		$asset['dependencies'],
		$asset['version'],
		true
	);

	wp_localize_script('cns-story-map-panel', 'cnsStorySuite', [
		'restUrl'  => rest_url('cns-story-suite/v1'),
		'nonce'    => wp_create_nonce('wp_rest'),
		'editorUrl' => add_query_arg(['page' => CNS_STORY_PAGE_EDITOR], admin_url('admin.php')),
	]);
});
