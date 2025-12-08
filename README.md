# WooCommerce Variation Gallery

A WooCommerce plugin that allows assigning multiple gallery images to individual product variations. When a customer selects a variation, the entire product gallery is replaced with the variation-specific images.

## Features

- **Per-Variation Galleries**: Assign unique gallery images to each product variation
- **Drag & Drop Sorting**: Easily reorder gallery images in the admin panel
- **Smooth Transitions**: CSS animations when swapping galleries on the frontend
- **WooCommerce Compatible**: Works with FlexSlider, Zoom, and PhotoSwipe
- **Lightweight**: Only loads assets on pages where needed
- **Secure**: Includes nonce verification, capability checks, and proper sanitization

## Requirements

- WordPress 6.0 or higher
- WooCommerce 5.0 or higher
- PHP 7.4 or higher

## Installation

### Via WordPress Admin

1. Download the latest release ZIP file
2. Go to **Plugins → Add New → Upload Plugin**
3. Select the ZIP file and click **Install Now**
4. Activate the plugin

### Via FTP/SFTP

1. Extract the ZIP file
2. Upload the `woocommerce-variations-gallery` folder to `/wp-content/plugins/`
3. Activate the plugin in **Plugins → Installed Plugins**

## Usage

### Adding Gallery Images to Variations

1. Go to **Products → Edit Product**
2. Scroll down to **Product Data → Variations**
3. Click on a variation to expand it
4. Find the **Variation Gallery** section
5. Click **Add Gallery Images** to open the media library
6. Select one or more images and click **Add to Gallery**
7. Drag images to reorder them
8. Click **Save changes**

### Frontend Behavior

- When a customer selects a variation **with** a custom gallery, the product gallery is replaced with the variation images
- When a customer selects a variation **without** a custom gallery, the original product gallery is displayed
- When the selection is cleared, the original gallery is restored

## Screenshots

### Admin: Variation Gallery Field
The gallery field appears in each variation's settings panel, allowing you to add, remove, and reorder images.

### Frontend: Gallery Swap
When a variation is selected, the gallery smoothly transitions to show the variation-specific images.

## How It Works

### Data Storage

Gallery image IDs are stored as post meta on the variation:
- **Meta Key**: `_wvg_gallery_image_ids`
- **Format**: Comma-separated attachment IDs (e.g., `123,456,789`)

### Hooks Used

| Hook | Purpose |
|------|---------|
| `woocommerce_product_after_variable_attributes` | Renders the gallery UI in admin |
| `woocommerce_admin_process_variation_object` | Saves gallery data |
| `woocommerce_available_variation` | Adds gallery HTML to variation JSON |

### JavaScript Events

| Event | Purpose |
|-------|---------|
| `found_variation.wc-variation-form` | Triggers gallery swap |
| `reset_data` | Restores original gallery |

## Security

This plugin implements WordPress security best practices:

- ✅ Direct file access prevention (`ABSPATH` check)
- ✅ Capability verification (`edit_products`)
- ✅ Nonce verification (WooCommerce nonces)
- ✅ Input sanitization (`sanitize_text_field`, `absint`)
- ✅ Output escaping (`esc_attr`, `esc_url`, `esc_html`)
- ✅ Prepared statements (uses WordPress native functions)

## Changelog

### 1.0.1
- Added nonce verification for save operations
- Added capability check (`edit_products`)
- Improved JavaScript security (DOM methods instead of HTML strings)
- Added `wp_unslash()` before sanitization

### 1.0.0
- Initial release
- Per-variation gallery support
- Drag & drop sorting
- Smooth frontend transitions
- WooCommerce gallery compatibility

## FAQ

### Does this work with all themes?

The plugin is designed to work with any theme that uses the standard WooCommerce product gallery structure. If your theme heavily customizes the gallery, some adjustments may be needed.

### Can I use this with quick view plugins?

Quick view plugins that load product data via AJAX should work, as the gallery data is included in the variation JSON response.

### What happens if I deactivate the plugin?

The gallery data remains stored in the database. If you reactivate the plugin, your variation galleries will still be there. The data is only removed if you delete the variations themselves.

### Does this affect performance?

The plugin only loads its assets on single product pages with variable products that have variation galleries. There is minimal performance impact.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This plugin is licensed under the GPL v2 or later.

```
This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
```

## Credits

- **Author**: [FreyRaum UG](https://www.freyraum-ug.com)
- **Website**: [https://www.freyraum-ug.com](https://www.freyraum-ug.com)

## Support

For bug reports and feature requests, please use the [GitHub Issues](../../issues) page.
