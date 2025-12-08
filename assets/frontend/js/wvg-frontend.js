/**
 * FynDesign Variation Gallery - Frontend JavaScript
 *
 * Handles gallery swapping when product variations are selected
 */

(function($) {
    'use strict';

    var WVG_Frontend = {

        /**
         * Original gallery HTML for reset
         */
        originalGalleryHtml: '',

        /**
         * Gallery jQuery object
         */
        $gallery: null,

        /**
         * Gallery wrapper jQuery object
         */
        $galleryWrapper: null,

        /**
         * Transition duration in ms
         */
        transitionDuration: 300,

        /**
         * Flag to prevent multiple simultaneous swaps
         */
        isSwapping: false,

        /**
         * Initialize frontend functionality
         */
        init: function() {
            var self = this;

            // Cache DOM elements
            this.$gallery = $('.woocommerce-product-gallery');
            this.$galleryWrapper = this.$gallery.find('.woocommerce-product-gallery__wrapper');

            if (!this.$gallery.length || !this.$galleryWrapper.length) {
                return;
            }

            // Store original gallery HTML from server
            if (typeof wvg_frontend_params !== 'undefined' && wvg_frontend_params.original_gallery_html) {
                this.originalGalleryHtml = wvg_frontend_params.original_gallery_html;
                this.transitionDuration = parseInt(wvg_frontend_params.transition_duration, 10) || 300;
            } else {
                // Fallback: store current gallery HTML
                this.originalGalleryHtml = this.$galleryWrapper.html();
            }

            // Bind events
            this.bindEvents();
        },

        /**
         * Bind event handlers
         */
        bindEvents: function() {
            var self = this;

            // Listen for variation found event
            $('.variations_form')
                .on('found_variation.wc-variation-form', function(event, variation) {
                    self.onVariationFound(variation);
                })
                .on('reset_data', function() {
                    self.onReset();
                });
        },

        /**
         * Handle variation found event
         *
         * @param {Object} variation Variation data object
         */
        onVariationFound: function(variation) {
            // Check if variation has custom gallery
            if (variation.wvg_gallery && variation.wvg_gallery.has_gallery && variation.wvg_gallery.html) {
                // Swap to variation gallery
                this.swapGallery(variation.wvg_gallery.html);
            } else {
                // No custom gallery - restore original product gallery
                // This ensures switching from a variant with gallery to one without shows the default
                if (this.originalGalleryHtml) {
                    this.swapGallery(this.originalGalleryHtml);
                }
            }
        },

        /**
         * Handle reset event (when selection is cleared)
         */
        onReset: function() {
            // Restore original product gallery
            if (this.originalGalleryHtml) {
                this.swapGallery(this.originalGalleryHtml);
            }
        },

        /**
         * Swap gallery with new HTML
         *
         * @param {string} newHtml New gallery HTML
         */
        swapGallery: function(newHtml) {
            var self = this;

            // Prevent multiple simultaneous swaps
            if (this.isSwapping) {
                return;
            }

            this.isSwapping = true;

            // Fade out current gallery
            this.$gallery.addClass('fvg-swapping');

            setTimeout(function() {
                // Destroy current gallery plugins
                self.destroyGallery();

                // Replace gallery HTML
                self.$galleryWrapper.html(newHtml);

                // Reinitialize gallery after brief delay for DOM update
                setTimeout(function() {
                    self.initGallery();

                    // Fade in new gallery
                    self.$gallery.removeClass('fvg-swapping');

                    self.isSwapping = false;
                }, 50);

            }, self.transitionDuration);
        },

        /**
         * Destroy current gallery plugins
         */
        destroyGallery: function() {
            // Destroy FlexSlider
            var flexsliderData = this.$gallery.data('flexslider');
            if (flexsliderData) {
                this.$gallery.removeData('flexslider');
            }

            // Remove FlexSlider generated elements
            this.$gallery.find('.flex-viewport').children().unwrap();
            this.$gallery.find('.flex-direction-nav, .flex-control-nav, .flex-pauseplay').remove();

            // Destroy Zoom on all images
            this.$gallery.find('.woocommerce-product-gallery__image').each(function() {
                var $this = $(this);
                // Try to trigger zoom destroy
                $this.trigger('zoom.destroy');
                // Remove zoom wrapper if present
                $this.find('.zoomImg').remove();
            });

            // Remove PhotoSwipe trigger
            this.$gallery.find('.woocommerce-product-gallery__trigger').remove();

            // Remove gallery data
            this.$gallery.removeData('product_gallery');
        },

        /**
         * Initialize gallery plugins
         */
        initGallery: function() {
            // Check if WooCommerce gallery function exists
            if (typeof $.fn.wc_product_gallery !== 'function') {
                return;
            }

            // Get WooCommerce single product params
            var params = typeof wc_single_product_params !== 'undefined' ? wc_single_product_params : {};

            // Initialize WooCommerce product gallery
            this.$gallery.wc_product_gallery(params);

            // Trigger gallery events
            this.$gallery.trigger('woocommerce_gallery_reset_slide_position');
        }
    };

    // Initialize on document ready
    $(document).ready(function() {
        // Only init on single product pages with variable products
        if ($('.woocommerce-product-gallery').length > 0 && $('.variations_form').length > 0) {
            WVG_Frontend.init();
        }
    });

})(jQuery);
