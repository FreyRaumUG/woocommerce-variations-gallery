<?php
/**
 * WVG Frontend
 *
 * Handles frontend functionality for variation galleries
 */

if (!defined('ABSPATH')) {
    exit;
}

class WVG_Frontend {

    /**
     * Original gallery HTML storage
     */
    private $original_gallery_html = '';

    /**
     * Constructor
     */
    public function __construct() {
        // Add gallery data to variation JSON
        add_filter('woocommerce_available_variation', [$this, 'add_gallery_data'], 10, 3);

        // Enqueue frontend assets
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);

        // Store original gallery for fallback
        add_action('woocommerce_before_single_product', [$this, 'store_original_gallery']);
    }

    /**
     * Add gallery and title data to variation JSON response
     *
     * @param array $variation_data Variation data array
     * @param WC_Product $product Parent product
     * @param WC_Product_Variation $variation Variation object
     * @return array Modified variation data
     */
    public function add_gallery_data($variation_data, $product, $variation) {
        $variation_id = $variation->get_id();

        // Add gallery data
        $gallery_ids = WVG_Gallery_Helper::get_variation_gallery_ids($variation_id);

        if (!empty($gallery_ids)) {
            // Variation has custom gallery - generate HTML
            $gallery_html = WVG_Gallery_Helper::get_gallery_html($gallery_ids, $variation_id);

            $variation_data['wvg_gallery'] = [
                'has_gallery' => true,
                'image_ids'   => $gallery_ids,
                'html'        => $gallery_html,
            ];
        } else {
            // No custom gallery - WooCommerce will use default behavior (variation main image only)
            $variation_data['wvg_gallery'] = [
                'has_gallery' => false,
            ];
        }

        // Add title data
        $custom_title = WVG_Admin::get_variation_title($variation_id);
        $variation_data['wvg_title'] = [
            'has_custom_title' => !empty($custom_title),
            'title'            => !empty($custom_title) ? $custom_title : $product->get_name(),
            'original_title'   => $product->get_name(),
        ];

        return $variation_data;
    }

    /**
     * Store original product gallery HTML for fallback
     */
    public function store_original_gallery() {
        global $product;

        if (!$product || !$product->is_type('variable')) {
            return;
        }

        // We'll generate this via JavaScript instead
    }

    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_frontend_assets() {
        // Only load on single product pages with variable products
        if (!is_product()) {
            return;
        }

        global $product;

        // Get product if not already loaded
        if (!$product) {
            $product = wc_get_product(get_the_ID());
        }

        if (!$product || !$product->is_type('variable')) {
            return;
        }

        // Check if any variation has a custom gallery
        $has_variation_galleries = $this->product_has_variation_galleries($product);

        if (!$has_variation_galleries) {
            return;
        }

        // Enqueue frontend CSS
        wp_enqueue_style(
            'fvg-frontend',
            WVG_PLUGIN_URL . 'assets/frontend/css/fvg-frontend.css',
            [],
            WVG_VERSION
        );

        // Enqueue frontend JS
        wp_enqueue_script(
            'fvg-frontend',
            WVG_PLUGIN_URL . 'assets/frontend/js/fvg-frontend.js',
            ['jquery', 'wc-single-product'],
            WVG_VERSION,
            true
        );

        // Get original product gallery HTML
        $original_gallery_html = $this->get_product_gallery_html($product);

        // Localize script with settings
        wp_localize_script('fvg-frontend', 'wvg_frontend_params', [
            'original_gallery_html' => $original_gallery_html,
            'original_title'        => $product->get_name(),
            'transition_duration'   => 300,
            'title_selector'        => '.product_title, .entry-title, .wp-block-post-title',
        ]);
    }

    /**
     * Check if any variation of a product has a custom gallery
     *
     * @param WC_Product_Variable $product Variable product
     * @return bool
     */
    private function product_has_variation_galleries($product) {
        $variations = $product->get_available_variations();

        foreach ($variations as $variation) {
            $variation_id = $variation['variation_id'];
            if (WVG_Gallery_Helper::variation_has_gallery($variation_id)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get product gallery HTML
     *
     * @param WC_Product $product Product object
     * @return string Gallery wrapper HTML
     */
    private function get_product_gallery_html($product) {
        // Get main image ID
        $main_image_id = $product->get_image_id();
        $gallery_ids = $product->get_gallery_image_ids();

        // Combine main image with gallery
        $all_image_ids = [];

        if ($main_image_id) {
            $all_image_ids[] = $main_image_id;
        }

        if (!empty($gallery_ids)) {
            $all_image_ids = array_merge($all_image_ids, $gallery_ids);
        }

        // If no images, return empty
        if (empty($all_image_ids)) {
            return '';
        }

        // Generate gallery HTML
        $html = '';
        $is_first = true;

        foreach ($all_image_ids as $attachment_id) {
            if (function_exists('wc_get_gallery_image_html')) {
                $html .= wc_get_gallery_image_html($attachment_id, $is_first);
            }
            $is_first = false;
        }

        return $html;
    }
}
