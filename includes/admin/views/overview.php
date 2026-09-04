<?php
defined('ABSPATH') || exit;

$per_page_options   = [10, 20, 50, 100];
$requested_per_page = (int) ($_GET['per_page'] ?? 20);
$per_page           = in_array($requested_per_page, $per_page_options, true) ? $requested_per_page : 20;
$paged              = max(1, absint($_GET['paged'] ?? 1));
$in_trash           = (sanitize_key($_GET['status'] ?? '') === 'trash');
$total_stories      = cns_story_suite_count_stories($in_trash);
$trash_count        = cns_story_suite_count_stories(true);
$total_pages        = (int) ceil($total_stories / $per_page);
$stories            = cns_story_suite_get_all_stories($per_page, ($paged - 1) * $per_page, $in_trash);

$return_page = sanitize_key($_GET['page'] ?? CNS_STORY_PAGE_SETTINGS);
$editor_url  = add_query_arg(['page' => CNS_STORY_PAGE_EDITOR], admin_url('admin.php'));
$delete_on_uninstall  = (bool) get_option('cns_story_suite_delete_on_uninstall', false);
$show_stories_menu    = (bool) get_option('cns_story_suite_show_stories_menu', false);
$show_substories_menu = (bool) get_option('cns_story_suite_show_substories_menu', false);
$archive_enabled      = cns_story_suite_archive_enabled();
$archive_slug         = cns_story_suite_archive_slug();
$archive_per_page     = cns_story_suite_archive_per_page();
$archive_order        = cns_story_suite_archive_order();
$archive_order_opts   = cns_story_suite_archive_order_options();
$archive_url          = $archive_enabled ? get_post_type_archive_link('cns_story') : '';
?>
<div class="cns-stories-overview">

	<?php if (isset($_GET['trashed']) && $_GET['trashed'] === '1') : ?>
		<div class="notice notice-success is-dismissible">
			<p><?php esc_html_e('Story moved to trash.', 'cns-story-suite'); ?></p>
		</div>
	<?php endif; ?>

	<?php if (isset($_GET['restored']) && $_GET['restored'] === '1') : ?>
		<div class="notice notice-success is-dismissible">
			<p><?php esc_html_e('Story restored from trash. Restored stories are set to Draft.', 'cns-story-suite'); ?></p>
		</div>
	<?php endif; ?>

	<?php if (isset($_GET['deleted']) && $_GET['deleted'] === '1') : ?>
		<div class="notice notice-success is-dismissible">
			<p><?php esc_html_e('Story permanently deleted.', 'cns-story-suite'); ?></p>
		</div>
	<?php endif; ?>

	<?php if (isset($_GET['settings-saved']) && $_GET['settings-saved'] === '1') : ?>
		<div class="notice notice-success is-dismissible">
			<p><?php esc_html_e('Settings saved.', 'cns-story-suite'); ?></p>
		</div>
	<?php endif; ?>

	<div class="cns-maps-overview__header">
		<h1><?php esc_html_e('Stories', 'cns-story-suite'); ?></h1>
		<a href="<?php echo esc_url($editor_url); ?>" class="button button-primary">
			<?php esc_html_e('+ New Story', 'cns-story-suite'); ?>
		</a>
	</div>

	<?php if ($trash_count > 0 || $in_trash) : ?>
		<ul class="subsubsub" style="margin: 0 0 4px;">
			<li>
				<a href="<?php echo esc_url(add_query_arg(['page' => $return_page], admin_url('admin.php'))); ?>"
					<?php if (! $in_trash) : ?>class="current"<?php endif; ?>>
					<?php esc_html_e('All', 'cns-story-suite'); ?>
					<span class="count">(<?php echo (int) cns_story_suite_count_stories(); ?>)</span>
				</a> |
			</li>
			<li>
				<a href="<?php echo esc_url(add_query_arg(['page' => $return_page, 'status' => 'trash'], admin_url('admin.php'))); ?>"
					<?php if ($in_trash) : ?>class="current"<?php endif; ?>>
					<?php esc_html_e('Trash', 'cns-story-suite'); ?>
					<span class="count">(<?php echo (int) $trash_count; ?>)</span>
				</a>
			</li>
		</ul>
	<?php endif; ?>

	<div class="cns-maps-overview__page-count">
		<form method="get">
			<?php if ($in_trash) : ?>
				<input type="hidden" name="status" value="trash" />
			<?php endif; ?>
			<input type="hidden" name="page" value="<?php echo esc_attr($return_page); ?>" />
			<label for="cns-per-page"><?php esc_html_e('Items per page:', 'cns-story-suite'); ?></label>
			<select name="per_page" id="cns-per-page" onchange="this.form.submit()">
				<?php foreach ($per_page_options as $option) : ?>
					<option value="<?php echo $option; ?>" <?php selected($per_page, $option); ?>>
						<?php echo $option; ?>
					</option>
				<?php endforeach; ?>
			</select>
		</form>
	</div>

	<table class="wp-list-table widefat fixed striped cns-maps-table">
		<thead>
			<tr>
				<th class="col-thumb"></th>
				<th><?php esc_html_e('Title', 'cns-story-suite'); ?></th>
				<th><?php esc_html_e('Map', 'cns-story-suite'); ?></th>
				<th><?php esc_html_e('Nodes', 'cns-story-suite'); ?></th>
				<th><?php esc_html_e('Status', 'cns-story-suite'); ?></th>
				<th><?php esc_html_e('Date', 'cns-story-suite'); ?></th>
				<th><?php esc_html_e('Actions', 'cns-story-suite'); ?></th>
			</tr>
		</thead>
		<tbody>
			<?php if (! $stories) : ?>
				<tr>
					<td colspan="7"><?php esc_html_e('No stories found.', 'cns-story-suite'); ?></td>
				</tr>
			<?php endif; ?>
			<?php foreach ($stories as $story) :
				global $wpdb;
				$map_id    = (int) get_post_meta($story->ID, '_cns_story_map_id', true);
				$map_title = $map_id ? get_the_title($map_id) : '—';
				$node_count = (int) $wpdb->get_var(
					$wpdb->prepare(
						"SELECT COUNT(*) FROM {$wpdb->prefix}cns_story_nodes WHERE story_id = %d",
						$story->ID
					)
				);
				$thumb_id  = (int) get_post_thumbnail_id($story->ID);
				$thumb_url = $thumb_id ? wp_get_attachment_image_url($thumb_id, 'thumbnail') : '';

				$edit_url   = esc_url(add_query_arg(
					['page' => CNS_STORY_PAGE_EDITOR, 'story_id' => $story->ID],
					admin_url('admin.php')
				));
				$action_url = static function (string $action) use ($return_page, $story): string {
					return esc_url(wp_nonce_url(
						add_query_arg(
							['page' => $return_page, 'action' => $action, 'story_id' => $story->ID],
							admin_url('admin.php')
						),
						'cns_' . $action . '_story_' . $story->ID
					));
				};
			?>
				<tr>
					<td class="col-thumb">
						<a href="<?php echo $edit_url; ?>">
							<?php if ($thumb_url) : ?>
								<img src="<?php echo esc_url($thumb_url); ?>" alt="<?php echo esc_attr($story->post_title ?: ''); ?>" />
							<?php else : ?>
								<div class="cns-thumb-placeholder"></div>
							<?php endif; ?>
						</a>
					</td>
					<td>
						<strong>
							<a href="<?php echo $edit_url; ?>">
								<?php echo esc_html($story->post_title ?: __('(no title)', 'cns-story-suite')); ?>
							</a>
						</strong>
					</td>
					<td><?php echo esc_html($map_title); ?></td>
					<td><?php echo (int) $node_count; ?></td>
					<td><?php
						$labels = ['publish' => __('Published', 'cns-story-suite'), 'draft' => __('Draft', 'cns-story-suite'), 'private' => __('Private', 'cns-story-suite'), 'trash' => __('Trash', 'cns-story-suite')];
						echo esc_html($labels[$story->post_status] ?? ucfirst($story->post_status));
					?></td>
					<td><?php echo esc_html(get_the_date('Y-m-d', $story)); ?></td>
					<td class="cns-maps-actions">
						<?php if ($in_trash) : ?>
							<a href="<?php echo $action_url('restore'); ?>"><?php esc_html_e('Restore', 'cns-story-suite'); ?></a>
							&nbsp;&middot;&nbsp;
							<a
								href="<?php echo $action_url('delete-forever'); ?>"
								class="cns-delete-link"
								data-confirm="<?php esc_attr_e('Permanently delete this story and all its nodes, paths and edges? This cannot be undone.', 'cns-story-suite'); ?>"
							><?php esc_html_e('Delete Permanently', 'cns-story-suite'); ?></a>
						<?php else : ?>
							<a href="<?php echo $edit_url; ?>"><?php esc_html_e('Edit', 'cns-story-suite'); ?></a>
							<?php if (in_array($story->post_status, ['publish', 'private'], true)) : ?>
								&nbsp;&middot;&nbsp;
								<a href="<?php echo esc_url(get_permalink($story->ID)); ?>" target="_blank" rel="noopener">
									<?php esc_html_e('View', 'cns-story-suite'); ?>
								</a>
							<?php endif; ?>
							&nbsp;&middot;&nbsp;
							<a
								href="<?php echo $action_url('delete'); ?>"
								class="cns-delete-link"
								data-confirm="<?php esc_attr_e('Move this story to trash?', 'cns-story-suite'); ?>"
							><?php esc_html_e('Trash', 'cns-story-suite'); ?></a>
						<?php endif; ?>
					</td>
				</tr>
			<?php endforeach; ?>
		</tbody>
	</table>

	<?php if ($total_pages > 1) : ?>
		<div class="tablenav bottom">
			<div class="tablenav-pages">
				<?php echo paginate_links([
					'base'      => add_query_arg('paged', '%#%'),
					'format'    => '',
					'current'   => $paged,
					'total'     => $total_pages,
					'prev_text' => '&laquo;',
					'next_text' => '&raquo;',
				]); ?>
			</div>
		</div>
	<?php endif; ?>

	<div class="cns-danger-zone">
		<h2><?php esc_html_e('Plugin Settings', 'cns-story-suite'); ?></h2>
		<form method="post">
			<?php wp_nonce_field('cns_story_save_settings'); ?>
			<input type="hidden" name="cns_story_action" value="save_settings" />
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">
						<?php esc_html_e('Story archive', 'cns-story-suite'); ?>
						<?php if ($archive_url) : ?>
							<a href="<?php echo esc_url($archive_url); ?>" target="_blank"
							   style="display:block;font-size:12px;font-weight:normal;">
								<?php esc_html_e('View archive ↗', 'cns-story-suite'); ?>
							</a>
						<?php endif; ?>
					</th>
					<td>
						<label>
							<input type="checkbox" name="archive_enabled" value="1" <?php checked($archive_enabled); ?> />
							<?php esc_html_e('Enable the public story archive', 'cns-story-suite'); ?>
						</label>
						<p class="description">
							<?php esc_html_e('Publishes a listing of all stories at the slug below. Off by default. Substories have no archive of their own.', 'cns-story-suite'); ?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="cns_story_archive_slug"><?php esc_html_e('URL slug', 'cns-story-suite'); ?></label>
					</th>
					<td>
						<input
							type="text"
							id="cns_story_archive_slug"
							name="archive_slug"
							value="<?php echo esc_attr($archive_slug); ?>"
							class="regular-text"
							pattern="[a-z0-9\-]+"
							placeholder="<?php echo esc_attr(CNS_STORY_ARCHIVE_DEFAULT_SLUG); ?>"
						/>
						<p class="description">
							<?php esc_html_e('Lowercase letters, numbers, and hyphens only. Changes the archive URL and every single story URL — existing links will break.', 'cns-story-suite'); ?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="cns_story_archive_per_page"><?php esc_html_e('Stories per page', 'cns-story-suite'); ?></label>
					</th>
					<td>
						<input
							type="number"
							id="cns_story_archive_per_page"
							name="archive_per_page"
							value="<?php echo esc_attr($archive_per_page); ?>"
							min="1" step="1"
							class="small-text"
						/>
						<p class="description">
							<?php esc_html_e('Overrides the global Reading Settings value for the story archive only.', 'cns-story-suite'); ?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="cns_story_archive_order"><?php esc_html_e('Default sort order', 'cns-story-suite'); ?></label>
					</th>
					<td>
						<select id="cns_story_archive_order" name="archive_order">
							<?php foreach ($archive_order_opts as $value => $label) : ?>
								<option value="<?php echo esc_attr($value); ?>" <?php selected($archive_order, $value); ?>>
									<?php echo esc_html($label); ?>
								</option>
							<?php endforeach; ?>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e('Admin menu visibility', 'cns-story-suite'); ?></th>
					<td>
						<label>
							<input type="checkbox" name="show_stories_menu" value="1" <?php checked($show_stories_menu); ?> />
							<?php esc_html_e('Show Stories in the WordPress admin sidebar', 'cns-story-suite'); ?>
						</label>
						<br />
						<label>
							<input type="checkbox" name="show_substories_menu" value="1" <?php checked($show_substories_menu); ?> />
							<?php esc_html_e('Show Substories in the WordPress admin sidebar', 'cns-story-suite'); ?>
						</label>
						<p class="description">
							<?php esc_html_e('Adds the standard WordPress list screens for stories and substories to the sidebar. The CNS editor pages here stay the primary management UI.', 'cns-story-suite'); ?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e('Uninstall behaviour', 'cns-story-suite'); ?></th>
					<td>
						<label>
							<input type="checkbox" name="delete_on_uninstall" value="1" <?php checked($delete_on_uninstall); ?> />
							<?php esc_html_e('Delete all story and substory posts when this plugin is uninstalled', 'cns-story-suite'); ?>
						</label>
						<p class="description">
							<?php esc_html_e('When unchecked (default), posts are kept after uninstall. Custom DB tables are always removed.', 'cns-story-suite'); ?>
						</p>
					</td>
				</tr>
			</table>
			<?php submit_button(__('Save Settings', 'cns-story-suite'), 'secondary'); ?>
		</form>
	</div>

</div>
