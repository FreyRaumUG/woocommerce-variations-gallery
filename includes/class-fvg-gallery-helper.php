<?php
/**
 * FVG Gallery Helper
 *
 * Handles gallery HTML generation for variations
 */

if (!defined('ABSPATH')) {
    exit;
}

class FVG_Gallery_Helper {

    /**
     * Meta key for storing variation gallery image IDs
     */
    const META_KEY = '_fvg_gallery_image_ids';

    /**
     * Get gallery image IDs for a variation
     *
     * @param int $variation_id Variation ID
     * @return array Array of attachment IDs
     */
    public static function get_variation_gallery_ids($variation_id) {
        $gallery_ids = get_post_meta($variation_id, self::META_KEY, true);

        if (empty($gallery_ids)) {
            return [];
        }

        // Convert comma-separated string to array
        $ids = array_filter(array_map('absint', explode(',', $gallery_ids)));

        return $ids;
    }

    /**
     * Save gallery image IDs for a variation
     *
     * @param int $variation_id Variation ID
     * @param array|string $image_ids Array or comma-separated string of attachment IDs
     */
    public static function save_variation_gallery_ids($variation_id, $image_ids) {
        if (is_array($image_ids)) {
            $image_ids = implode(',', array_filter(array_map('absint', $image_ids)));
        }

        // Sanitize comma-separated string
        $image_ids = implode(',', array_filter(array_map('absint', explode(',', $image_ids))));

        if (empty($image_ids)) {
            delete_post_meta($variation_id, self::META_KEY);
        } else {
            update_post_meta($variation_id, self::META_KEY, $image_ids);
        }
    }

    /**
     * Generate gallery HTML for a set of image IDs
     * Compatible with WooCommerce gallery structure
     *
     * @param array $image_ids Array of attachment IDs
     * @param int $variation_id Variation ID (for main image fallback)
     * @return string Gallery HTML
     */
    public static function get_gallery_html($image_ids, $variation_id = 0) {
        if (empty($image_ids) || !is_array($image_ids)) {
            return '';
        }

        $html = '';
        $is_first = true;

        foreach ($image_ids as $attachment_id) {
            $attachment_id = absint($attachment_id);

            if (!$attachment_id || !wp_attachment_is_image($attachment_id)) {
                continue;
            }

            // Use WooCommerce's built-in function if available
            if (function_exists('wc_get_gallery_image_html')) {
                $html .= wc_get_gallery_image_html($attachment_id, $is_first);
            } else {
                // Fallback: Generate HTML manually
                $html .= self::generate_image_html($attachment_id, $is_first);
            }

            $is_first = false;
        }

        return $html;
    }

    /**
     * Fallback method to generate image HTML
     *
     * @param int $attachment_id Attachment ID
     * @param bool $is_main Whether this is the main image
     * @return string Image HTML
     */
    private static function generate_image_html($attachment_id, $is_main = false) {
        $full_size = wp_get_attachment_image_src($attachment_id, 'full');
        $thumbnail = wp_get_attachment_image_src($attachment_id, 'woocommerce_single');
        $gallery_thumbnail = wp_get_attachment_image_src($attachment_id, 'woocommerce_gallery_thumbnail');
        $alt_text = get_post_meta($attachment_id, '_wp_attachment_image_alt', true);

        if (!$full_size || !$thumbnail) {
            return '';
        }

        $attributes = [
            'title'                   => get_the_title($attachment_id),
            'data-caption'            => get_the_excerpt($attachment_id),
            'data-src'                => $full_size[0],
            'data-large_image'        => $full_size[0],
            'data-large_image_width'  => $full_size[1],
            'data-large_image_height' => $full_size[2],
            'class'                   => 'wp-post-image',
        ];

        $html = '<div data-thumb="' . esc_url($gallery_thumbnail[0]) . '" data-thumb-alt="' . esc_attr($alt_text) . '" class="woocommerce-product-gallery__image">';
        $html .= '<a href="' . esc_url($full_size[0]) . '">';
        $html .= wp_get_attachment_image($attachment_id, 'woocommerce_single', false, $attributes);
        $html .= '</a>';
        $html .= '</div>';

        return $html;
    }

    /**
     * Get the main image ID for a variation
     *
     * @param int $variation_id Variation ID
     * @return int|false Attachment ID or false
     */
    public static function get_variation_main_image_id($variation_id) {
        $variation = wc_get_product($variation_id);

        if (!$variation) {
            return false;
        }

        return $variation->get_image_id();
    }

    /**
     * Get gallery image IDs from parent product
     *
     * @param int $product_id Parent product ID
     * @return array Array of attachment IDs
     */
    public static function get_parent_gallery_ids($product_id) {
        $product = wc_get_product($product_id);

        if (!$product) {
            return [];
        }

        return $product->get_gallery_image_ids();
    }

    /**
     * Check if a variation has custom gallery images
     *
     * @param int $variation_id Variation ID
     * @return bool
     */
    public static function variation_has_gallery($variation_id) {
        $ids = self::get_variation_gallery_ids($variation_id);
        return !empty($ids);
    }
}
