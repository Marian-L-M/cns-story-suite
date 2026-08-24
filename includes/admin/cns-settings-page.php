<?php
/**
 * CNS settings page — shared framework.
 *
 * Builds the top-level "CNS" admin menu and the tabbed settings page shared by
 * the Clouds And Spaceships theme and the CNS suite plugins. An identical copy
 * of this file ships with every provider:
 *
 *   clouds-and-spaceships  functions/theme-admin/cns-settings-page.php
 *   cns-wiki-suite         admin/cns-settings-page.php
 *   cns-map-suite          includes/admin/cns-settings-page.php
 *   cns-story-suite        includes/admin/cns-settings-page.php
 *
 * Everything is wrapped in a function_exists guard, so whichever copy loads
 * first (plugins load before the theme) provides the page and the other
 * copies are no-ops. Keep all copies identical when editing.
 *
 * Providers add their tabs via the `cns_admin_tabs` filter:
 *
 *   add_filter( 'cns_admin_tabs', function ( array $tabs ): array {
 *       $tabs['my-slug'] = [
 *           'menu_title' => 'My Suite',       // sidebar label
 *           'title'      => 'My Suite Title', // horizontal tab label
 *           'capability' => 'manage_options',
 *           'callback'   => 'my_suite_render_tab', // callable
 *           'priority'   => 40,               // lower = further left/up
 *       ];
 *       return $tabs;
 *   } );
 *
 * Each tab becomes an admin page with the slug cns-settings-{slug}. The bare
 * parent slug cns-settings also resolves to the lowest-priority tab, so old
 * bookmarks keep working.
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'cns_admin_get_tabs' ) ) :

/**
 * Returns the ordered tab definitions from every active provider.
 * Result is cached so apply_filters only runs once per request.
 */
function cns_admin_get_tabs(): array {
    static $tabs = null;
    if ( null !== $tabs ) {
        return $tabs;
    }

    $tabs = (array) apply_filters( 'cns_admin_tabs', [] );

    uasort( $tabs, static function ( array $a, array $b ): int {
        return ( (int) ( $a['priority'] ?? 50 ) ) <=> ( (int) ( $b['priority'] ?? 50 ) );
    } );

    return $tabs;
}

/**
 * Returns the WP admin page slug for a given tab slug.
 */
function cns_admin_page_slug( string $tab_slug ): string {
    return 'cns-settings-' . $tab_slug;
}

/**
 * Resolves the tab slug of the settings page being requested, or null when the
 * current request is not a CNS settings page. The bare parent slug
 * (cns-settings) maps to the default (lowest-priority) tab.
 */
function cns_admin_active_tab(): ?string {
    $tabs = cns_admin_get_tabs();
    $page = sanitize_key( wp_unslash( $_GET['page'] ?? '' ) );

    if ( 'cns-settings' === $page ) {
        return array_key_first( $tabs );
    }
    foreach ( $tabs as $slug => $tab ) {
        if ( $page === cns_admin_page_slug( $slug ) ) {
            return $slug;
        }
    }
    return null;
}

// ── Menu registration ─────────────────────────────────────────────────────────

add_action( 'admin_menu', 'cns_admin_register_menus', 99 );

function cns_admin_register_menus(): void {
    $tabs = cns_admin_get_tabs();
    if ( ! $tabs ) {
        return;
    }

    $default = $tabs[ array_key_first( $tabs ) ];

    // Top-level entry — dashicons-cloud, position 99 = bottom of sidebar.
    add_menu_page(
        __( 'Clouds And Spaceships', 'cns-theme' ),
        __( 'CNS', 'cns-theme' ),
        $default['capability'] ?? 'manage_options',
        'cns-settings',
        'cns_admin_render_page',
        'dashicons-cloud',
        99
    );

    // One named submenu per tab.
    foreach ( $tabs as $slug => $tab ) {
        add_submenu_page(
            'cns-settings',
            __( 'Clouds And Spaceships', 'cns-theme' ),
            esc_html( $tab['menu_title'] ),
            $tab['capability'] ?? 'manage_options',
            cns_admin_page_slug( $slug ),
            'cns_admin_render_page'
        );
    }

    // Remove the auto-generated duplicate of the parent entry; the top-level
    // link then points at the first tab's submenu page.
    remove_submenu_page( 'cns-settings', 'cns-settings' );
}

// ── Page renderer ─────────────────────────────────────────────────────────────

function cns_admin_render_page(): void {
    $tabs       = cns_admin_get_tabs();
    $active_tab = cns_admin_active_tab() ?? array_key_first( $tabs );
    $active     = $tabs[ $active_tab ] ?? null;

    if ( ! $active || ! current_user_can( $active['capability'] ?? 'manage_options' ) ) {
        wp_die( esc_html__( 'You do not have permission to access this page.', 'cns-theme' ) );
    }
    ?>
    <div class="wrap">

      <h1><?php esc_html_e( 'Clouds And Spaceships', 'cns-theme' ); ?></h1>

      <nav class="nav-tab-wrapper" aria-label="<?php esc_attr_e( 'CNS settings sections', 'cns-theme' ); ?>">
        <?php foreach ( $tabs as $slug => $tab ) :
            if ( ! current_user_can( $tab['capability'] ?? 'manage_options' ) ) continue;
            $url          = admin_url( 'admin.php?page=' . cns_admin_page_slug( $slug ) );
            $active_class = $slug === $active_tab ? ' nav-tab-active' : '';
        ?>
          <a href="<?php echo esc_url( $url ); ?>" class="nav-tab<?php echo esc_attr( $active_class ); ?>">
            <?php echo esc_html( $tab['title'] ); ?>
          </a>
        <?php endforeach; ?>
      </nav>

      <div class="cns-admin-tab-content">
        <?php
        if ( is_callable( $active['callback'] ?? null ) ) {
            call_user_func( $active['callback'] );
        } else {
            echo '<p>' . esc_html__( 'No content available for this tab.', 'cns-theme' ) . '</p>';
        }
        ?>
      </div>

    </div>
    <?php
}

// ── Shared assets ─────────────────────────────────────────────────────────────
//
// The media picker is used by tabs from several providers (theme login images,
// wiki placeholder thumbnail), so it lives in the framework and loads on every
// CNS settings page.

add_action( 'admin_enqueue_scripts', 'cns_admin_enqueue_shared_assets' );

function cns_admin_enqueue_shared_assets( string $hook ): void {
    if ( ! str_contains( $hook, 'cns-settings' ) ) {
        return;
    }
    wp_enqueue_media();
    wp_add_inline_script( 'jquery', cns_admin_media_picker_js() );
}

function cns_admin_media_picker_js(): string {
    return <<<'JS'
(function ($) {
    $(function () {
        $('.cns-media-btn').on('click', function (e) {
            e.preventDefault();
            var btn      = $(this);
            var inputId  = btn.data('input');
            var imgId    = btn.data('preview');
            var removeId = btn.data('remove');
            var frame    = wp.media({
                title:    btn.data('title') || 'Select Image',
                button:   { text: 'Use this image' },
                multiple: false,
                library:  { type: 'image' },
            });
            frame.on('select', function () {
                var att = frame.state().get('selection').first().toJSON();
                $('#' + inputId).val(att.id);
                $('#' + imgId).attr('src', att.url).show();
                $('#' + removeId).show();
                btn.text(btn.data('change-label') || 'Change image');
            });
            frame.open();
        });

        $('.cns-media-remove-btn').on('click', function (e) {
            e.preventDefault();
            var btn      = $(this);
            var inputId  = btn.data('input');
            var imgId    = btn.data('preview');
            var pickerId = btn.data('picker');
            $('#' + inputId).val('');
            $('#' + imgId).attr('src', '').hide();
            btn.hide();
            $('#' + pickerId).text($('#' + pickerId).data('select-label') || 'Select image');
        });
    });
})(jQuery);
JS;
}

endif;
