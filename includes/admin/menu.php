<?php

defined('ABSPATH') || exit;

function cns_story_suite_register_menus(): void {
	if (get_template() === 'clouds-and-spaceships') {
		cns_story_suite_register_under_cns_theme();
	} else {
		cns_story_suite_register_standalone();
	}
}
add_action('admin_menu', 'cns_story_suite_register_menus', 10);

/**
 * CNS theme active: register tabs via cns_admin_tabs filter + hidden editor sub-page.
 */
function cns_story_suite_register_under_cns_theme(): void {
	add_filter('cns_admin_tabs', function (array $tabs): array {
		$tabs['stories'] = [
			'menu_title' => __('Stories', 'cns-story-suite'),
			'title'      => __('CNS Story Suite', 'cns-story-suite'),
			'capability' => 'manage_stories',
			'callback'   => 'cns_story_suite_render_overview',
			'priority'   => 40,
		];
		$tabs['substories'] = [
			'menu_title' => __('Substories', 'cns-story-suite'),
			'title'      => __('Substories', 'cns-story-suite'),
			'capability' => 'edit_posts',
			'callback'   => 'cns_story_suite_render_substories',
			'priority'   => 41,
		];
		return $tabs;
	});

	// Hidden sub-page for the story editor.
	add_submenu_page(
		'cns-settings',
		__('Story Editor', 'cns-story-suite'),
		__('Story Editor', 'cns-story-suite'),
		'manage_stories',
		CNS_STORY_PAGE_EDITOR,
		'cns_story_suite_render_editor'
	);
	remove_submenu_page('cns-settings', CNS_STORY_PAGE_EDITOR);
}

/**
 * CNS theme not active: standalone top-level Stories menu.
 */
function cns_story_suite_register_standalone(): void {
	add_menu_page(
		__('Stories', 'cns-story-suite'),
		__('Stories', 'cns-story-suite'),
		'manage_stories',
		CNS_STORY_PAGE_STORIES,
		'cns_story_suite_render_overview',
		'dashicons-book',
		59
	);

	add_submenu_page(
		CNS_STORY_PAGE_STORIES,
		__('All Stories', 'cns-story-suite'),
		__('All Stories', 'cns-story-suite'),
		'manage_stories',
		CNS_STORY_PAGE_STORIES,
		'cns_story_suite_render_overview'
	);

	add_submenu_page(
		CNS_STORY_PAGE_STORIES,
		__('Substories', 'cns-story-suite'),
		__('Substories', 'cns-story-suite'),
		'edit_posts',
		CNS_STORY_PAGE_SUBSTORIES,
		'cns_story_suite_render_substories'
	);

	add_submenu_page(
		CNS_STORY_PAGE_STORIES,
		__('New Story', 'cns-story-suite'),
		__('New Story', 'cns-story-suite'),
		'manage_stories',
		CNS_STORY_PAGE_EDITOR,
		'cns_story_suite_render_editor'
	);
}

// ── Asset enqueuing ───────────────────────────────────────────────────────────

function cns_story_suite_enqueue_admin_assets(): void {
	$page = sanitize_key($_GET['page'] ?? '');

	$is_story_page = in_array($page, [
		CNS_STORY_PAGE_STORIES,
		CNS_STORY_PAGE_EDITOR,
		CNS_STORY_PAGE_SETTINGS,
		CNS_STORY_PAGE_SUBSTORIES,
	], true);

	if (! $is_story_page) {
		return;
	}

	$css_file = CNS_STORY_SUITE_DIR . 'build/admin/index.css';
	if (file_exists($css_file)) {
		wp_enqueue_style(
			'cns-story-admin',
			CNS_STORY_SUITE_URL . 'build/admin/index.css',
			[],
			CNS_STORY_SUITE_VERSION
		);
	}

	$asset_file = CNS_STORY_SUITE_DIR . 'build/admin/index.asset.php';
	$asset      = file_exists($asset_file)
		? require $asset_file
		: ['dependencies' => [], 'version' => CNS_STORY_SUITE_VERSION];

	wp_enqueue_script(
		'cns-story-admin',
		CNS_STORY_SUITE_URL . 'build/admin/index.js',
		array_merge(['wp-color-picker', 'cns-toast'], $asset['dependencies']),
		$asset['version'],
		true
	);

	$overview_page = get_template() === 'clouds-and-spaceships' ? CNS_STORY_PAGE_SETTINGS : CNS_STORY_PAGE_STORIES;

	wp_localize_script('cns-story-admin', 'cnsStorySuite', [
		'restUrl'       => rest_url('cns-story-suite/v1'),
		'mapRestUrl'    => rest_url('cns-map-suite/v1'),
		'wpRestUrl'     => rest_url('wp/v2'),
		'nonce'         => wp_create_nonce('wp_rest'),
		'overviewUrl'   => add_query_arg(['page' => $overview_page], admin_url('admin.php')),
		'editorUrl'     => add_query_arg(['page' => CNS_STORY_PAGE_EDITOR], admin_url('admin.php')),
		'substoriesUrl' => admin_url('edit.php?post_type=cns_substory'),
	]);

	if ($page === CNS_STORY_PAGE_EDITOR) {
		wp_enqueue_media();
		wp_enqueue_style('wp-color-picker');
		// Styles for @wordpress/components (the script dep comes from the
		// generated asset file, but the stylesheet must be enqueued manually).
		wp_enqueue_style('wp-components');
	}
}
add_action('admin_enqueue_scripts', 'cns_story_suite_enqueue_admin_assets');

// ── Render callbacks ──────────────────────────────────────────────────────────

function cns_story_suite_render_overview(): void {
	include CNS_STORY_SUITE_DIR . 'includes/admin/views/overview.php';
}

function cns_story_suite_render_editor(): void {
	include CNS_STORY_SUITE_DIR . 'includes/admin/views/editor.php';
}

function cns_story_suite_render_substories(): void {
	include CNS_STORY_SUITE_DIR . 'includes/admin/views/substories-overview.php';
}

// ── Handle overview actions ───────────────────────────────────────────────────

add_action('admin_init', function (): void {
	// Settings save — must run in admin_init so headers aren't yet sent.
	if (
		isset($_POST['cns_story_action']) &&
		$_POST['cns_story_action'] === 'save_settings' &&
		check_admin_referer('cns_story_save_settings') &&
		current_user_can('manage_stories')
	) {
		update_option('cns_story_suite_delete_on_uninstall',   ! empty($_POST['delete_on_uninstall']));
		update_option('cns_story_suite_show_stories_menu',     ! empty($_POST['show_stories_menu']));
		update_option('cns_story_suite_show_substories_menu',  ! empty($_POST['show_substories_menu']));
		$return_page = sanitize_key($_GET['page'] ?? CNS_STORY_PAGE_STORIES);
		wp_safe_redirect(add_query_arg(['page' => $return_page, 'settings-saved' => '1'], admin_url('admin.php')));
		exit;
	}
});

// Trash / restore / permanent delete. "Delete" moves the story to trash and
// keeps its node/path/edge rows, so restoring is lossless; rows are purged by
// the before_delete_post hook (includes/database.php) only when the post is
// permanently deleted — from here, from the trash being emptied, or from any
// other deletion path.
add_action('admin_init', function (): void {
	$page   = sanitize_key($_GET['page'] ?? '');
	$action = sanitize_key($_GET['action'] ?? '');

	$overview_pages = [CNS_STORY_PAGE_STORIES, CNS_STORY_PAGE_SETTINGS];
	$actions        = ['delete' => 'trashed', 'restore' => 'restored', 'delete-forever' => 'deleted'];
	if (! in_array($page, $overview_pages, true) || ! isset($actions[$action])) {
		return;
	}

	$story_id = (int) ($_GET['story_id'] ?? 0);
	if (! $story_id || ! check_admin_referer('cns_' . $action . '_story_' . $story_id)) {
		return;
	}

	$story = get_post($story_id);
	if ($story && $story->post_type === 'cns_story' && current_user_can('manage_stories')) {
		switch ($action) {
			case 'delete':
				wp_trash_post($story_id);
				break;
			case 'restore':
				wp_untrash_post($story_id);
				break;
			case 'delete-forever':
				wp_delete_post($story_id, true);
				break;
		}
	}

	wp_safe_redirect(add_query_arg(['page' => $page, $actions[$action] => '1'], admin_url('admin.php')));
	exit;
});
