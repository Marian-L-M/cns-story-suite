<?php
defined('ABSPATH') || exit;

$per_page_options   = [10, 20, 50, 100];
$requested_per_page = (int) ($_GET['per_page'] ?? 20);
$per_page           = in_array($requested_per_page, $per_page_options, true) ? $requested_per_page : 20;
$paged              = max(1, absint($_GET['paged'] ?? 1));
$total_stories      = cns_story_suite_count_stories();
$total_pages        = (int) ceil($total_stories / $per_page);
$stories            = cns_story_suite_get_all_stories($per_page, ($paged - 1) * $per_page);

$return_page = sanitize_key($_GET['page'] ?? CNS_STORY_PAGE_STORIES);
$editor_url  = add_query_arg(['page' => CNS_STORY_PAGE_EDITOR], admin_url('admin.php'));
$delete_on_uninstall = (bool) get_option('cns_story_suite_delete_on_uninstall', false);
?>
<div class="cns-stories-overview">

	<?php if (isset($_GET['deleted'])) : ?>
		<div class="notice notice-success is-dismissible">
			<p><?php esc_html_e('Story deleted.', 'cns-story-suite'); ?></p>
		</div>
	<?php endif; ?>

	<div class="cns-maps-overview__header">
		<h1><?php esc_html_e('Stories', 'cns-story-suite'); ?></h1>
		<a href="<?php echo esc_url($editor_url); ?>" class="button button-primary">
			<?php esc_html_e('+ New Story', 'cns-story-suite'); ?>
		</a>
	</div>

	<div class="cns-maps-overview__page-count">
		<form method="get">
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
				$delete_url = esc_url(wp_nonce_url(
					add_query_arg(
						['page' => $return_page, 'action' => 'delete', 'story_id' => $story->ID],
						admin_url('admin.php')
					),
					'cns_delete_story_' . $story->ID
				));
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
						$labels = ['publish' => __('Published', 'cns-story-suite'), 'draft' => __('Draft', 'cns-story-suite'), 'private' => __('Private', 'cns-story-suite')];
						echo esc_html($labels[$story->post_status] ?? ucfirst($story->post_status));
					?></td>
					<td><?php echo esc_html(get_the_date('Y-m-d', $story)); ?></td>
					<td class="cns-maps-actions">
						<a href="<?php echo $edit_url; ?>"><?php esc_html_e('Edit', 'cns-story-suite'); ?></a>
						<?php if (in_array($story->post_status, ['publish', 'private'], true)) : ?>
							&nbsp;&middot;&nbsp;
							<a href="<?php echo esc_url(get_permalink($story->ID)); ?>" target="_blank" rel="noopener">
								<?php esc_html_e('View', 'cns-story-suite'); ?>
							</a>
						<?php endif; ?>
						&nbsp;&middot;&nbsp;
						<a
							href="<?php echo $delete_url; ?>"
							class="cns-delete-link"
							data-confirm="<?php esc_attr_e('Permanently delete this story?', 'cns-story-suite'); ?>"
						><?php esc_html_e('Delete', 'cns-story-suite'); ?></a>
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
<?php
// Handle settings save.
if (
	isset($_POST['cns_story_action']) &&
	$_POST['cns_story_action'] === 'save_settings' &&
	check_admin_referer('cns_story_save_settings')
) {
	update_option('cns_story_suite_delete_on_uninstall', ! empty($_POST['delete_on_uninstall']));
	wp_safe_redirect(add_query_arg(['page' => $return_page, 'settings-saved' => '1'], admin_url('admin.php')));
	exit;
}
