<?php
/**
 * Story archive — settings, query overrides, and rewrite maintenance.
 *
 * Mirrors the archive model cns-wiki-suite exposes on the shared CNS settings
 * page: one slug that serves both the archive and the single-post permalinks,
 * plus per-page and sort-order overrides for the archive query.
 *
 * The archive ships disabled. Enabling it publishes a listing at /{slug}/ that
 * did not exist before, so it is an explicit choice rather than a side effect
 * of updating the plugin.
 *
 * Substories are deliberately not given an archive: they are fragments shown
 * inside a story, not standalone entries worth listing on their own.
 */

defined('ABSPATH') || exit;

const CNS_STORY_ARCHIVE_DEFAULT_SLUG     = 'stories';
const CNS_STORY_ARCHIVE_DEFAULT_PER_PAGE = 12;
const CNS_STORY_ARCHIVE_DEFAULT_ORDER    = 'date_desc';

function cns_story_suite_archive_enabled(): bool {
	return (bool) get_option('cns_story_suite_archive_enabled', false);
}

/** Lowercase slug used for both the archive and single story permalinks. */
function cns_story_suite_archive_slug(): string {
	$slug = preg_replace(
		'/[^a-z0-9\-]/',
		'',
		strtolower((string) get_option('cns_story_suite_archive_slug', CNS_STORY_ARCHIVE_DEFAULT_SLUG))
	);
	return $slug ?: CNS_STORY_ARCHIVE_DEFAULT_SLUG;
}

function cns_story_suite_archive_per_page(): int {
	return max(1, (int) get_option('cns_story_suite_archive_per_page', CNS_STORY_ARCHIVE_DEFAULT_PER_PAGE));
}

function cns_story_suite_archive_order(): string {
	$order = sanitize_key((string) get_option('cns_story_suite_archive_order', CNS_STORY_ARCHIVE_DEFAULT_ORDER));
	return in_array($order, ['date_desc', 'date_asc', 'title_asc'], true)
		? $order
		: CNS_STORY_ARCHIVE_DEFAULT_ORDER;
}

/** Sort-order choices, shared by the settings UI and the query override. */
function cns_story_suite_archive_order_options(): array {
	return [
		'date_desc' => __('Newest first', 'cns-story-suite'),
		'date_asc'  => __('Oldest first', 'cns-story-suite'),
		'title_asc' => __('Title (A–Z)', 'cns-story-suite'),
	];
}

// ── Archive query ─────────────────────────────────────────────────────────────

add_action('pre_get_posts', 'cns_story_suite_archive_query');

function cns_story_suite_archive_query(WP_Query $query): void {
	if (is_admin() || ! $query->is_main_query() || ! $query->is_post_type_archive('cns_story')) {
		return;
	}

	$query->set('posts_per_page', cns_story_suite_archive_per_page());

	switch (cns_story_suite_archive_order()) {
		case 'date_asc':
			$query->set('orderby', 'date');
			$query->set('order', 'ASC');
			break;
		case 'title_asc':
			$query->set('orderby', 'title');
			$query->set('order', 'ASC');
			break;
		default:
			$query->set('orderby', 'date');
			$query->set('order', 'DESC');
	}
}

// ── Rewrite maintenance ───────────────────────────────────────────────────────
//
// flush_rewrite_rules() has to run AFTER the CPT re-registers with the new
// slug. On the request that saves the option, init has already fired with the
// old slug, so flushing there would bake the old value back into the rules.
// Instead a flag is set on save and the flush happens on the next init.

foreach (['cns_story_suite_archive_slug', 'cns_story_suite_archive_enabled'] as $watched) {
	add_action("update_option_{$watched}", 'cns_story_suite_schedule_rewrite_flush', 10, 2);
	add_action("add_option_{$watched}", 'cns_story_suite_schedule_rewrite_flush', 10, 2);
}

function cns_story_suite_schedule_rewrite_flush($a = null, $b = null): void {
	update_option('cns_story_suite_needs_flush', true);
}

// Priority 99 — after cns_story_suite_register_post_types (priority 10) has
// registered the CPTs with the current slug.
add_action('init', 'cns_story_suite_flush_rewrites_if_needed', 99);

function cns_story_suite_flush_rewrites_if_needed(): void {
	if (get_option('cns_story_suite_needs_flush')) {
		delete_option('cns_story_suite_needs_flush');
		flush_rewrite_rules();
	}
}
