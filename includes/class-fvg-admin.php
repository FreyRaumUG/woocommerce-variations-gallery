<?php
/**
 * FVG Admin
 *
 * Handles admin functionality for variation galleries
 */

if (!defined('ABSPATH')) {
    exit;
}

class FVG_Admin {

    /**
     * Constructor
     */
    public function __construct() {
        // Add gallery field to variation form
        add_action('woocommerce_product_after_variable_attributes', [$this, 'render_gallery_field'], 10, 3);

        // Save gallery data
        add_action('woocommerce_admin_process_variation_object', [$this, 'save_gallery_data'], 10, 2);

        // Enqueue admin assets
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
    }

    /**
     * Render gallery upload field in variation form
     *
     * @param int $loop Variation loop index
     * @param array $variation_data Variation data
     * @param WP_Post $variation Variation post object
     */
    public function render_gallery_field($loop, $variation_data, $variation) {
        $variation_id = $variation->ID;
        $gallery_ids = FVG_Gallery_Helper::get_variation_gallery_ids($variation_id);
        $gallery_ids_string = implode(',', $gallery_ids);
        ?>
        <div class="fvg-variation-gallery form-row form-row-full" data-variation-loop="<?php echo esc_attr($loop); ?>">
            <label>
                <?php esc_html_e('Varianten-Galerie', 'fyndesign-variation-gallery'); ?>
                <span class="woocommerce-help-tip" data-tip="<?php esc_attr_e('Fügen Sie zusätzliche Galerie-Bilder für diese Variante hinzu. Diese ersetzen die Hauptprodukt-Galerie wenn die Variante ausgewählt wird.', 'fyndesign-variation-gallery'); ?>"></span>
            </label>

            <div class="fvg-gallery-images">
                <?php if (!empty($gallery_ids)): ?>
                    <?php foreach ($gallery_ids as $attachment_id): ?>
                        <?php
                        $attachment_id = absint($attachment_id);
                        if (!$attachment_id) continue;
                        $image = wp_get_attachment_image_src($attachment_id, 'thumbnail');
                        if (!$image) continue;
                        ?>
                        <div class="fvg-gallery-item" data-attachment-id="<?php echo esc_attr($attachment_id); ?>">
                            <img src="<?php echo esc_url($image[0]); ?>" alt="">
                            <button type="button" class="fvg-remove-image" title="<?php esc_attr_e('Entfernen', 'fyndesign-variation-gallery'); ?>">
                                <span class="dashicons dashicons-no-alt"></span>
                            </button>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>

            <input type="hidden"
                   name="fvg_gallery_ids[<?php echo esc_attr($loop); ?>]"
                   class="fvg-gallery-ids"
                   value="<?php echo esc_attr($gallery_ids_string); ?>">

            <button type="button" class="button fvg-add-images">
                <?php esc_html_e('Galerie-Bilder hinzufügen', 'fyndesign-variation-gallery'); ?>
            </button>

            <p class="description">
                <?php esc_html_e('Ziehen Sie die Bilder um die Reihenfolge zu ändern.', 'fyndesign-variation-gallery'); ?>
            </p>
        </div>
        <?php
    }

    /**
     * Save gallery data when variation is saved
     *
     * @param WC_Product_Variation $variation Variation object
     * @param int $i Variation index
     */
    public function save_gallery_data($variation, $i) {
        // Security: Verify user capability
        if (!current_user_can('edit_products')) {
            return;
        }

        // Security: Verify WooCommerce nonce (set by WooCommerce in variation form)
        if (!isset($_POST['woocommerce_meta_nonce']) || !wp_verify_nonce($_POST['woocommerce_meta_nonce'], 'woocommerce_save_data')) {
            // Fallback: Check security nonce
            if (!isset($_POST['security']) || !wp_verify_nonce($_POST['security'], 'save-variations')) {
                return;
            }
        }

        if (isset($_POST['fvg_gallery_ids'][$i])) {
            $gallery_ids = sanitize_text_field(wp_unslash($_POST['fvg_gallery_ids'][$i]));
            FVG_Gallery_Helper::save_variation_gallery_ids($variation->get_id(), $gallery_ids);
        }
    }

    /**
     * Enqueue admin scripts and styles
     *
     * @param string $hook Current admin page hook
     */
    public function enqueue_admin_assets($hook) {
        global $post;

        // Only load on product edit page
        if (!in_array($hook, ['post.php', 'post-new.php'])) {
            return;
        }

        if (!$post || $post->post_type !== 'product') {
            return;
        }

        // Enqueue WordPress media library
        wp_enqueue_media();

        // Enqueue jQuery UI Sortable
        wp_enqueue_script('jquery-ui-sortable');

        // Enqueue admin CSS
        wp_enqueue_style(
            'fvg-admin',
            FVG_PLUGIN_URL . 'assets/admin/css/fvg-admin.css',
            [],
            FVG_VERSION
        );

        // Enqueue admin JS
        wp_enqueue_script(
            'fvg-admin',
            FVG_PLUGIN_URL . 'assets/admin/js/fvg-admin.js',
            ['jquery', 'jquery-ui-sortable', 'wp-util'],
            FVG_VERSION,
            true
        );

        // Localize script
        wp_localize_script('fvg-admin', 'fvg_admin_params', [
            'i18n_select_images' => __('Galerie-Bilder auswählen', 'fyndesign-variation-gallery'),
            'i18n_add_to_gallery' => __('Zur Galerie hinzufügen', 'fyndesign-variation-gallery'),
            'i18n_remove' => __('Entfernen', 'fyndesign-variation-gallery'),
        ]);
    }
}
