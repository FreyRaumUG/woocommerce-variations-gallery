/**
 * FynDesign Variation Gallery - Admin JavaScript
 *
 * Handles media library integration and image sorting for variation galleries
 */

(function($) {
    'use strict';

    var WVG_Admin = {

        /**
         * Initialize admin functionality
         */
        init: function() {
            this.bindEvents();
            this.initSortable();
        },

        /**
         * Bind event handlers
         */
        bindEvents: function() {
            var self = this;

            // Use event delegation for dynamically loaded variations
            $('#woocommerce-product-data')
                .on('click', '.fvg-add-images', function(e) {
                    e.preventDefault();
                    self.openMediaFrame($(this));
                })
                .on('click', '.fvg-remove-image', function(e) {
                    e.preventDefault();
                    self.removeImage($(this));
                });

            // Reinitialize sortable when variations are loaded via AJAX
            $(document).on('woocommerce_variations_loaded', function() {
                self.initSortable();
            });
        },

        /**
         * Open WordPress media frame for image selection
         *
         * @param {jQuery} $button The clicked button
         */
        openMediaFrame: function($button) {
            var self = this;
            var $container = $button.closest('.fvg-variation-gallery');
            var $imagesContainer = $container.find('.fvg-gallery-images');
            var $hiddenInput = $container.find('.fvg-gallery-ids');

            // Create media frame
            var frame = wp.media({
                title: wvg_admin_params.i18n_select_images,
                button: {
                    text: wvg_admin_params.i18n_add_to_gallery
                },
                multiple: true,
                library: {
                    type: 'image'
                }
            });

            // Handle image selection
            frame.on('select', function() {
                var selection = frame.state().get('selection');
                var currentIds = $hiddenInput.val() ? $hiddenInput.val().split(',').filter(Boolean) : [];

                selection.each(function(attachment) {
                    var id = attachment.get('id').toString();
                    var thumbUrl = attachment.get('sizes') && attachment.get('sizes').thumbnail
                        ? attachment.get('sizes').thumbnail.url
                        : attachment.get('url');

                    // Only add if not already in gallery
                    if (currentIds.indexOf(id) === -1) {
                        currentIds.push(id);

                        // Create thumbnail using jQuery DOM methods (safer than HTML string)
                        var $item = $('<div>', {
                            'class': 'fvg-gallery-item',
                            'data-attachment-id': parseInt(id, 10) // Ensure numeric
                        });

                        $('<img>', {
                            src: thumbUrl,
                            alt: ''
                        }).appendTo($item);

                        $('<button>', {
                            type: 'button',
                            'class': 'fvg-remove-image',
                            title: wvg_admin_params.i18n_remove
                        }).append(
                            $('<span>', { 'class': 'dashicons dashicons-no-alt' })
                        ).appendTo($item);

                        $imagesContainer.append($item);
                    }
                });

                // Update hidden input
                $hiddenInput.val(currentIds.join(','));

                // Mark variation as changed
                self.markVariationChanged($container);

                // Reinitialize sortable
                self.initSortable();
            });

            frame.open();
        },

        /**
         * Remove an image from the gallery
         *
         * @param {jQuery} $button The clicked remove button
         */
        removeImage: function($button) {
            var $item = $button.closest('.fvg-gallery-item');
            var $container = $item.closest('.fvg-variation-gallery');
            var $hiddenInput = $container.find('.fvg-gallery-ids');
            var removeId = $item.data('attachment-id').toString();

            // Remove from ID list
            var currentIds = $hiddenInput.val().split(',').filter(Boolean);
            currentIds = currentIds.filter(function(id) {
                return id !== removeId;
            });
            $hiddenInput.val(currentIds.join(','));

            // Remove DOM element with animation
            $item.fadeOut(200, function() {
                $(this).remove();
            });

            // Mark variation as changed
            this.markVariationChanged($container);
        },

        /**
         * Initialize jQuery UI Sortable on gallery containers
         */
        initSortable: function() {
            var self = this;

            $('.fvg-gallery-images').each(function() {
                var $this = $(this);

                // Destroy existing sortable if present
                if ($this.hasClass('ui-sortable')) {
                    $this.sortable('destroy');
                }

                // Initialize sortable
                $this.sortable({
                    items: '.fvg-gallery-item',
                    cursor: 'move',
                    opacity: 0.65,
                    placeholder: 'fvg-sortable-placeholder',
                    tolerance: 'pointer',
                    update: function(event, ui) {
                        self.updateImageOrder($(this));
                    }
                });
            });
        },

        /**
         * Update image order in hidden input after sorting
         *
         * @param {jQuery} $imagesContainer The images container
         */
        updateImageOrder: function($imagesContainer) {
            var $container = $imagesContainer.closest('.fvg-variation-gallery');
            var $hiddenInput = $container.find('.fvg-gallery-ids');
            var ids = [];

            $imagesContainer.find('.fvg-gallery-item').each(function() {
                ids.push($(this).data('attachment-id'));
            });

            $hiddenInput.val(ids.join(','));

            // Mark variation as changed
            this.markVariationChanged($container);
        },

        /**
         * Mark variation as needing save
         *
         * @param {jQuery} $container The gallery container
         */
        markVariationChanged: function($container) {
            // Add WooCommerce's class to indicate changes
            $container.closest('.woocommerce_variation')
                .addClass('variation-needs-update');

            // Enable save buttons
            $('button.cancel-variation-changes, button.save-variation-changes')
                .prop('disabled', false);

            // Trigger WooCommerce's change event
            $('#variable_product_options').trigger('woocommerce_variations_input_changed');
        }
    };

    // Initialize on document ready
    $(document).ready(function() {
        WVG_Admin.init();
    });

})(jQuery);
