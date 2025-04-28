# YouTube Shorts Blocker Chrome Extension Setup

This document explains how to build and install the YouTube Shorts Blocker Chrome extension from this codebase.

## Building the Extension

1. Make sure you have Node.js and npm installed on your system.

2. Run the build script to create the extension:
   ```
   ./build-extension.sh
   ```

3. This will create an `extension-build` directory containing the compiled extension.

## Installing the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/` in the address bar.

2. Enable "Developer mode" by toggling the switch in the top-right corner of the page.

3. Click on the "Load unpacked" button that appears after enabling Developer mode.

4. Browse to and select the `extension-build` directory that was created during the build process.

5. The YouTube Shorts Blocker extension should now be installed and visible in your extensions list.

## Using the Extension

1. Click on the extension icon in your browser toolbar to access the main popup.

2. Toggle the main switches to enable/disable different features:
   - **Hide Shorts**: Removes Shorts from the YouTube interface
   - **Block Shorts**: Prevents navigation to Shorts content

3. Click on "Advanced Options" to access additional features:
   - **Custom Filters**: Create your own content filters
   - **Category Filters**: Filter specific content categories
   - **Whitelist**: Allow specific Shorts videos
   - **Statistics**: View usage statistics

4. Visit YouTube and enjoy a Shorts-free experience!

## Features

- Hide Shorts content from the YouTube interface
- Block navigation to Shorts URLs
- Create custom content filters
- Filter by content categories
- Whitelist specific Shorts videos
- Track statistics about blocked/hidden content
- Sync settings across devices (requires server)

## Server Integration

The extension can work in standalone mode or with a server:

- **Standalone Mode**: All settings are stored locally in Chrome storage
- **Server Mode**: Settings are synchronized with a database server

By default, the built extension will connect to `https://youtubeshortsblockr.replit.app/api` for server functionality.

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Ensure all permissions are granted to the extension
3. Try reloading the extension from the chrome://extensions page
4. If statistics tracking isn't working, make sure the server is running