<?php
defined('ABSPATH') || exit;

$per_page_options   = [10, 20, 50, 100];
$requested_per_page = (int) ($_GET['per_page'] ?? 20);
$per_page           = in_array($requested_per_page, $per_page_options, true) ? $requested_per_page : 20;
$paged              = max(1, absint($_GET['paged'] ?? 1));

$counts        = wp_count_posts('cns_substory');
$total         = (int) $counts->publish + (int) $counts->draft + (int) $counts->private;
$total_pages   = (int) ceil($total / $per_page);

$substories = get_posts([
	'post_type'      => 'cns_substory',
	'posts_per_page' => $per_page,
	'offset'         => ($paged - 1) * $per_page,
	'post_status'    => ['publish', 'draft', 'private'],
	'orderby'        => 'date',
	'order'          => 'DESC',
]);

$return_page = sanitize_key($_GET['page'] ?? CNS_STORY_PAGE_SUBSTORIES);
$new_url     = admin_url('post-new.php?post_type=cns_substory');
?>
<div class="cns-stories-overview">

	<?php if (isset($_GET['trashed'])) : ?>
		<div class="notice notice-success is-dismissible">
			<p><?php esc_html_e('Substory moved to trash.', 'cns-story-suite'); ?></p>
		</div>
	<?php endif; ?>

	<div class="cns-maps-overview__header">
		<h1><?php esc_html_e('Substories', 'cns-story-suite'); ?></h1>
		<a href="<?php echo esc_url($new_url); ?>" class="button button-primary">
			<?php esc_html_e('+ New Substory', 'cns-story-suite'); ?>
		</a>
	</div>

	<div class="cns-maps-overview__page-count">
		<form method="get">
			<input type="hidden" name="page" value="<?php echo esc_attr($return_page); ?>" />
			<label for="cns-sub-per-page"><?php esc_html_e('Items per page:', 'cns-story-suite'); ?></label>
			<select name="per_page" id="cns-sub-per-page" onchange="this.form.submit()">
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
				<th><?php esc_html_e('Status', 'cns-story-suite'); ?></th>
				<th><?php esc_html_e('Date', 'cns-story-suite'); ?></th>
				<th><?php esc_html_e('Actions', 'cns-story-suite'); ?></th>
			</tr>
		</thead>
		<tbody>
			<?php if (! $substories) : ?>
				<tr>
					<td colspan="5">
						<?php esc_html_e('No substories yet.', 'cns-story-suite'); ?>
						<a href="<?php echo esc_url($new_url); ?>">
							<?php esc_html_e('Create your first substory', 'cns-story-suite'); ?>
						</a>
					</td>
				</tr>
			<?php endif; ?>
			<?php foreach ($substories as $sub) :
				$thumb_id  = (int) get_post_thumbnail_id($sub->ID);
				$thumb_url = $thumb_id ? wp_get_attachment_image_url($thumb_id, 'thumbnail') : '';
				$edit_url  = get_edit_post_link($sub->ID);
				$view_url  = get_permalink($sub->ID);
				$status_labels = [
					'publish' => __('Published', 'cns-story-suite'),
					'draft'   => __('Draft', 'cns-story-suite'),
					'private' => __('Private', 'cns-story-suite'),
				];
			?>
				<tr>
					<td class="col-thumb">
						<a href="<?php echo esc_url($edit_url); ?>">
							<?php if ($thumb_url) : ?>
								<img src="<?php echo esc_url($thumb_url); ?>" alt="<?php echo esc_attr($sub->post_title ?: ''); ?>" />
							<?php else : ?>
								<div class="cns-thumb-placeholder"></div>
							<?php endif; ?>
						</a>
					</td>
					<td>
						<strong>
							<a href="<?php echo esc_url($edit_url); ?>">
								<?php echo esc_html($sub->post_title ?: __('(no title)', 'cns-story-suite')); ?>
							</a>
						</strong>
					</td>
					<td>
						<span class="cns-badge cns-badge--<?php echo esc_attr($sub->post_status); ?>">
							<?php echo esc_html($status_labels[$sub->post_status] ?? ucfirst($sub->post_status)); ?>
						</span>
					</td>
					<td><?php echo esc_html(get_the_date('Y-m-d', $sub)); ?></td>
					<td class="cns-maps-actions">
						<a href="<?php echo esc_url($edit_url); ?>">
							<?php esc_html_e('Edit', 'cns-story-suite'); ?>
						</a>
						<?php if (in_array($sub->post_status, ['publish', 'private'], true)) : ?>
							&nbsp;&middot;&nbsp;
							<a href="<?php echo esc_url($view_url); ?>" target="_blank" rel="noopener">
								<?php esc_html_e('View', 'cns-story-suite'); ?>
							</a>
						<?php endif; ?>
						&nbsp;&middot;&nbsp;
						<a
							href="<?php echo esc_url(get_delete_post_link($sub->ID)); ?>"
							class="cns-delete-link"
							onclick="return confirm('<?php esc_attr_e('Move this substory to trash?', 'cns-story-suite'); ?>')"
						><?php esc_html_e('Trash', 'cns-story-suite'); ?></a>
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

</div>
