<?php

defined('ABSPATH') || exit;

/**
 * Minimal render-data cache for the custom cns_story_* tables.
 *
 * Mirrors cns-map-suite's includes/cache.php: only raw table rows are cached
 * (via transients, so a persistent object cache is picked up automatically).
 * Serialization stays live per request — cns_story_suite_serialize_node()
 * applies per-user visibility rules (current_user_can), so its output must
 * never be shared between visitors. Page/object caching remains the job of
 * dedicated caching plugins.
 *
 * Invalidation is a single global version bump baked into the cache key: any
 * write through the plugin's REST API or a story deletion starts a fresh
 * generation, and superseded entries simply expire via TTL.
 */

const CNS_STORY_SUITE_CACHE_TTL = 12 * HOUR_IN_SECONDS;

function cns_story_suite_cache_key(int $story_id): string {
	$ver = (int) get_option('cns_story_suite_cache_ver', 0);
	return "cns_story_rows_{$story_id}_v{$ver}";
}

/** Returns the cached row sets for a story, keyed by kind ('nodes', 'paths', 'edges'). */
function cns_story_suite_cache_get(int $story_id): array {
	$rows = get_transient(cns_story_suite_cache_key($story_id));
	return is_array($rows) ? $rows : [];
}

function cns_story_suite_cache_set(int $story_id, array $rows): void {
	set_transient(cns_story_suite_cache_key($story_id), $rows, CNS_STORY_SUITE_CACHE_TTL);
}

function cns_story_suite_cache_flush(): void {
	update_option('cns_story_suite_cache_ver', (int) get_option('cns_story_suite_cache_ver', 0) + 1, true);
}

// Every table write goes through the plugin's REST namespace, so one route
// check replaces a flush call in each mutation callback.
add_filter('rest_request_after_callbacks', function ($response, $handler, $request) {
	if (
		! in_array($request->get_method(), ['GET', 'HEAD'], true) &&
		str_starts_with($request->get_route(), '/cns-story-suite/v1/') &&
		! is_wp_error($response)
	) {
		cns_story_suite_cache_flush();
	}
	return $response;
}, 10, 3);

// Story deletion (admin overview handler) removes table rows without going
// through the REST API.
add_action('deleted_post', function (int $post_id, WP_Post $post): void {
	if ($post->post_type === 'cns_story') {
		cns_story_suite_cache_flush();
	}
}, 10, 2);
