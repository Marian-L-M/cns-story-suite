<?php

defined('ABSPATH') || exit;

function cns_story_suite_add_capabilities(): void {
	$role = get_role('administrator');
	if ($role) {
		$role->add_cap('manage_stories');
	}
}

function cns_story_suite_remove_capabilities(): void {
	foreach (wp_roles()->roles as $role_name => $unused) {
		$role = get_role($role_name);
		if ($role && $role->has_cap('manage_stories')) {
			$role->remove_cap('manage_stories');
		}
	}
}
