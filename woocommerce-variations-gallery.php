<?php
/**
 * Plugin Name: WooCommerce Variations Gallery
 * Plugin URI: https://www.freyraum-ug.com
 * Description: Ermoeglicht das Zuordnen von Galerie-Bildern und benutzerdefinierten Titeln zu einzelnen WooCommerce Produktvarianten.
 * Version: 1.1.1
 * Author: FreyRaum UG
 * Author URI: https://www.freyraum-ug.com
 * Text Domain: woocommerce-variations-gallery
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * License: GPL v2 or later
 */

if (!defined('ABSPATH')) {
    exit;
}

define('WVG_VERSION', '1.1.1');
define('WVG_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WVG_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WVG_PLUGIN_BASENAME', plugin_basename(__FILE__));

final class FynDesign_Variation_Gallery {

    private static $instance = null;

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('plugins_loaded', array($this, 'init'));
    }

    public function init() {
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', array($this, 'woocommerce_missing_notice'));
            return;
        }

        $this->includes();
        $this->init_components();
    }

    public function woocommerce_missing_notice() {
        echo '<div class="error"><p><strong>WooCommerce Variations Gallery</strong> benoetigt WooCommerce.</p></div>';
    }

    private function includes() {
        require_once WVG_PLUGIN_DIR . 'includes/class-wvg-gallery-helper.php';
        require_once WVG_PLUGIN_DIR . 'includes/class-wvg-admin.php';
        require_once WVG_PLUGIN_DIR . 'includes/class-wvg-frontend.php';
    }

    private function init_components() {
        if (is_admin()) {
            new WVG_Admin();
        }

        if (!is_admin() || wp_doing_ajax()) {
            new WVG_Frontend();
        }
    }
}

function WVG() {
    return FynDesign_Variation_Gallery::instance();
}

WVG();
