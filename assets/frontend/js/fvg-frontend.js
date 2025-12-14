/**
 * FynDesign Variation Gallery - Frontend JavaScript
 *
 * Handles gallery and title swapping when product variations are selected
 */

(function($) {
    'use strict';

    var WVG_Frontend = {

        /**
         * Original gallery HTML for reset
         */
        originalGalleryHtml: '',

        /**
         * Original product title
         */
        originalTitle: '',

        /**
         * Gallery jQuery object
         */
        $gallery: null,

        /**
         * Gallery wrapper jQuery object
         */
        $galleryWrapper: null,

        /**
         * Title element(s)
         */
        $titleElements: null,

        /**
         * Transition duration in ms
         */
        transitionDuration: 300,

        /**
         * Flag to prevent multiple simultaneous swaps
         */
        isSwapping: false,

        /**
         * Pending gallery HTML for queued swap requests
         */
        pendingGalleryHtml: null,

        /**
         * Flag to track if we've swapped to a custom gallery
         */
        hasSwappedToCustomGallery: false,

        /**
         * Store variation image data when restoring original gallery
         * so we can re-apply WooCommerce's variation image after swap completes
         */
        pendingVariationImage: null,

        /**
         * Initialize frontend functionality
         */
        init: function() {
            var self = this;

            // Cache DOM elements
            this.$gallery = $('.woocommerce-product-gallery');
            this.$galleryWrapper = this.$gallery.find('.woocommerce-product-gallery__wrapper');

            // Find title elements - exclude site title
            var titleSelector = '.product_title, .entry-title, .wp-block-post-title';
            if (typeof wvg_frontend_params !== 'undefined' && wvg_frontend_params.title_selector) {
                titleSelector = wvg_frontend_params.title_selector;
            }
            this.$titleElements = $(titleSelector).filter(function() {
                return !$(this).hasClass('wp-block-site-title');
            }).first();

            if (!this.$gallery.length || !this.$galleryWrapper.length) {
                return;
            }

            // Store original data from server
            if (typeof wvg_frontend_params !== 'undefined') {
                this.originalGalleryHtml = wvg_frontend_params.original_gallery_html || '';
                this.originalTitle = wvg_frontend_params.original_title || '';
                this.transitionDuration = parseInt(wvg_frontend_params.transition_duration, 10) || 300;
            }

            // Fallback: If server-side is empty, destroy FlexSlider first to get clean HTML
            if (!this.originalGalleryHtml || this.originalGalleryHtml.trim() === '') {
                // Temporarily destroy gallery to get clean HTML (without FlexSlider wrappers)
                this.destroyGallery();
                this.originalGalleryHtml = this.$galleryWrapper.html();
                // Re-initialize gallery
                this.initGallery();
            }
            if (!this.originalTitle && this.$titleElements.length) {
                this.originalTitle = this.$titleElements.text().trim();
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
            // Handle title change
            if (variation.wvg_title) {
                var newTitle = variation.wvg_title.title;
                if (newTitle && this.$titleElements.length) {
                    this.updateTitle(newTitle);
                }
            }

            // Handle gallery change - check for valid custom gallery
            var hasCustomGallery = variation.wvg_gallery &&
                                   variation.wvg_gallery.has_gallery &&
                                   variation.wvg_gallery.html &&
                                   variation.wvg_gallery.html.trim() !== '';

            if (hasCustomGallery) {
                // Swap to custom variation gallery
                this.swapGallery(variation.wvg_gallery.html);
                this.hasSwappedToCustomGallery = true;
                this.pendingVariationImage = null; // Clear any pending
            } else if (this.hasSwappedToCustomGallery) {
                // Only restore original if we previously swapped to a custom gallery
                // Store the variation image to apply after gallery swap completes
                // because WooCommerce's image update will be overwritten by our swap
                this.pendingVariationImage = variation.image || null;

                if (this.originalGalleryHtml && this.originalGalleryHtml.trim() !== '') {
                    this.swapGallery(this.originalGalleryHtml);
                }
                this.hasSwappedToCustomGallery = false;
            }
            // If no custom gallery and we haven't swapped before, do nothing
            // Let WooCommerce handle the variation image swap
        },

        /**
         * Handle reset event (when selection is cleared)
         */
        onReset: function() {
            // Restore original title
            if (this.originalTitle && this.$titleElements.length) {
                this.updateTitle(this.originalTitle);
            }

            // Restore original product gallery only if we had swapped to a custom gallery
            if (this.hasSwappedToCustomGallery && this.originalGalleryHtml && this.originalGalleryHtml.trim() !== '') {
                this.swapGallery(this.originalGalleryHtml);
            }
            this.hasSwappedToCustomGallery = false;
        },

        /**
         * Update product title with animation
         *
         * @param {string} newTitle New title text
         */
        updateTitle: function(newTitle) {
            var self = this;
            var duration = this.transitionDuration / 2;

            this.$titleElements.animate({ opacity: 0 }, duration, function() {
                $(this).text(newTitle).animate({ opacity: 1 }, duration);
            });
        },

        /**
         * Swap gallery with new HTML
         *
         * @param {string} newHtml New gallery HTML
         */
        swapGallery: function(newHtml) {
            var self = this;

            // If already swapping, queue this request for later
            if (this.isSwapping) {
                this.pendingGalleryHtml = newHtml;
                return;
            }

            this.isSwapping = true;
            this.pendingGalleryHtml = null;

            // Fade out current gallery
            this.$gallery.addClass('fvg-swapping');

            setTimeout(function() {
                // Destroy current gallery plugins
                self.destroyGallery();

                // Replace gallery HTML
                self.$galleryWrapper.html(newHtml);

                // Re-cache wrapper reference in case DOM changed
                self.$galleryWrapper = self.$gallery.find('.woocommerce-product-gallery__wrapper');

                // Reinitialize gallery after brief delay for DOM update
                setTimeout(function() {
                    self.initGallery();

                    // Apply pending variation image after gallery restore
                    if (self.pendingVariationImage) {
                        self.applyVariationImage(self.pendingVariationImage);
                        self.pendingVariationImage = null;
                    }

                    // Fade in new gallery
                    self.$gallery.removeClass('fvg-swapping');

                    self.isSwapping = false;

                    // Process pending request if any
                    if (self.pendingGalleryHtml !== null) {
                        var pending = self.pendingGalleryHtml;
                        self.pendingGalleryHtml = null;
                        self.swapGallery(pending);
                    }
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
            var self = this;

            // Check if WooCommerce gallery function exists
            if (typeof $.fn.wc_product_gallery !== 'function') {
                return;
            }

            // Force remove all previous gallery initialization data
            this.$gallery.removeData('product_gallery');
            this.$gallery.removeData('flexslider');

            // Remove any existing event handlers that WooCommerce might have added
            this.$gallery.off('.wc-product-gallery');

            // Get WooCommerce single product params
            var params = typeof wc_single_product_params !== 'undefined' ? wc_single_product_params : {};

            // Initialize WooCommerce product gallery
            this.$gallery.wc_product_gallery(params);

            // Delay the reset trigger to ensure FlexSlider is fully initialized
            setTimeout(function() {
                // Only trigger if FlexSlider is properly initialized
                if (self.$gallery.data('flexslider')) {
                    self.$gallery.removeClass('fvg-no-slider');
                    self.$gallery.trigger('woocommerce_gallery_reset_slide_position');
                } else {
                    // Add class to enable CSS fallback for single-image display
                    self.$gallery.addClass('fvg-no-slider');

                    // Remove any inline styles that FlexSlider may have added
                    self.$galleryWrapper.removeAttr('style');
                    self.$gallery.find('.woocommerce-product-gallery__image').removeAttr('style');
                }
            }, 100);
        },

        /**
         * Apply variation image to the first gallery slide
         * Used after restoring original gallery to show the correct variation image
         *
         * @param {Object} image WooCommerce variation image object
         */
        applyVariationImage: function(image) {
            if (!image || !image.src) {
                return;
            }

            var $firstSlide = this.$gallery.find('.woocommerce-product-gallery__image').first();
            var $img = $firstSlide.find('img').first();
            var $link = $firstSlide.find('a').first();

            if (!$img.length) {
                return;
            }

            // Update image attributes
            $img.attr('src', image.src);

            if (image.srcset) {
                $img.attr('srcset', image.srcset);
            }
            if (image.sizes) {
                $img.attr('sizes', image.sizes);
            }
            if (image.alt) {
                $img.attr('alt', image.alt);
            }
            if (image.title) {
                $img.attr('title', image.title);
            }

            // Update link href for lightbox
            if ($link.length && image.full_src) {
                $link.attr('href', image.full_src);
            }

            // Update data attributes for zoom/lightbox
            if (image.full_src) {
                $firstSlide.attr('data-src', image.full_src);
                $firstSlide.attr('data-large_image', image.full_src);
            }
            if (image.full_src_w) {
                $firstSlide.attr('data-large_image_width', image.full_src_w);
            }
            if (image.full_src_h) {
                $firstSlide.attr('data-large_image_height', image.full_src_h);
            }
            if (image.thumb_src) {
                $firstSlide.attr('data-thumb', image.thumb_src);
            }

            // Trigger image load for zoom plugin
            $img.trigger('load');
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
