<?php

defined('ABSPATH') || exit;

function cns_story_suite_register_post_types(): void {
	// ── Story CPT ─────────────────────────────────────────────────────────────
	if (! post_type_exists('cns_story')) {
		register_post_type('cns_story', [
			'labels' => [
				'name'               => __('Stories', 'cns-story-suite'),
				'singular_name'      => __('Story', 'cns-story-suite'),
				'add_new'            => __('Add New Story', 'cns-story-suite'),
				'add_new_item'       => __('Add New Story', 'cns-story-suite'),
				'edit_item'          => __('Edit Story', 'cns-story-suite'),
				'new_item'           => __('New Story', 'cns-story-suite'),
				'view_item'          => __('View Story', 'cns-story-suite'),
				'search_items'       => __('Search Stories', 'cns-story-suite'),
				'not_found'          => __('No stories found', 'cns-story-suite'),
				'not_found_in_trash' => __('No stories found in trash', 'cns-story-suite'),
			],
			'public'              => true,
			'publicly_queryable'  => true,
			'show_in_rest'        => true,
			'show_ui'             => true,
			'show_in_menu'        => false,
			'show_in_nav_menus'   => true,
			'exclude_from_search' => false,
			'has_archive'         => false,
			'rewrite'             => ['slug' => 'stories'],
			'supports'            => ['title', 'editor', 'excerpt', 'thumbnail', 'custom-fields', 'tags', 'categories'],
			'taxonomies'          => ['post_tag', 'category'],
			'capability_type'     => 'post',
		]);
	}

	// ── Substory CPT ─────────────────────────────────────────────────────────
	if (! post_type_exists('cns_substory')) {
		register_post_type('cns_substory', [
			'labels' => [
				'name'               => __('Substories', 'cns-story-suite'),
				'singular_name'      => __('Substory', 'cns-story-suite'),
				'add_new'            => __('Add New Substory', 'cns-story-suite'),
				'add_new_item'       => __('Add New Substory', 'cns-story-suite'),
				'edit_item'          => __('Edit Substory', 'cns-story-suite'),
				'new_item'           => __('New Substory', 'cns-story-suite'),
				'view_item'          => __('View Substory', 'cns-story-suite'),
				'search_items'       => __('Search Substories', 'cns-story-suite'),
				'not_found'          => __('No substories found', 'cns-story-suite'),
				'not_found_in_trash' => __('No substories found in trash', 'cns-story-suite'),
			],
			'public'              => true,
			'publicly_queryable'  => true,
			'show_in_rest'        => true,
			'show_ui'             => true,
			'show_in_menu'        => false,
			'show_in_nav_menus'   => true,
			'exclude_from_search' => false,
			'has_archive'         => false,
			'rewrite'             => ['slug' => 'substories'],
			'supports'            => ['title', 'editor', 'excerpt', 'thumbnail', 'custom-fields'],
			'capability_type'     => 'post',
		]);
	}
}
add_action('init', 'cns_story_suite_register_post_types');

// ── Story meta fields ─────────────────────────────────────────────────────────

function cns_story_suite_register_post_meta(): void {
	$story_fields = [
		'_cns_story_map_id'       => 'integer',
		'_cns_story_line_color'   => 'string',
		'_cns_story_line_width'   => 'number',
		'_cns_story_line_style'   => 'string',
		'_cns_story_line_opacity' => 'number',
		'_cns_story_start_node_id' => 'integer',
	];

	foreach ($story_fields as $key => $type) {
		register_post_meta('cns_story', $key, [
			'type'          => $type,
			'single'        => true,
			'show_in_rest'  => false,
			'auth_callback' => fn() => current_user_can('edit_posts'),
		]);
	}
}
add_action('init', 'cns_story_suite_register_post_meta');

// ── Disable block editor for story CPT (uses custom canvas editor) ────────────

function cns_story_suite_disable_gutenberg(bool $use_editor, string $post_type): bool {
	if ($post_type === 'cns_story') {
		return false;
	}
	return $use_editor;
}
add_filter('use_block_editor_for_post_type', 'cns_story_suite_disable_gutenberg', 10, 2);

// ── Inject story block on single story pages ──────────────────────────────────

function cns_story_suite_inject_story_content(string $content): string {
	static $rendering = false;
	if ($rendering || ! is_singular('cns_story') || ! in_the_loop() || ! is_main_query()) {
		return $content;
	}
	$rendering = true;
	$result    = render_block([
		'blockName' => 'cns-story-suite/story',
		'attrs'     => ['storyId' => get_the_ID()],
	]);
	$rendering = false;
	return $result;
}
add_filter('the_content', 'cns_story_suite_inject_story_content', 5);

// ── Helpers ───────────────────────────────────────────────────────────────────

function cns_story_suite_get_all_stories(int $take = -1, int $skip = 0): array {
	return get_posts([
		'post_type'      => 'cns_story',
		'posts_per_page' => $take,
		'offset'         => $skip,
		'post_status'    => ['publish', 'draft', 'private'],
		'orderby'        => 'date',
		'order'          => 'DESC',
	]);
}

function cns_story_suite_count_stories(): int {
	$counts = wp_count_posts('cns_story');
	return (int) $counts->publish + (int) $counts->draft + (int) $counts->private;
}
