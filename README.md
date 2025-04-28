# YouTube Shorts Blocker

A powerful Chrome extension that lets you take control of your YouTube experience by hiding and blocking Shorts content. Built with TypeScript, React, and Express, this extension offers a suite of customization options to create a distraction-free browsing experience.

## Features

- **Hide Shorts**: Remove Shorts content from the YouTube sidebar and home feed
- **Block Shorts**: Prevent navigation to Shorts videos when clicked or searched
- **Custom Filters**: Create your own content filters with custom patterns
- **Category Filters**: Filter specific content categories beyond just Shorts
- **Statistics Tracking**: Monitor how many Shorts have been blocked and hidden
- **Whitelist**: Allow specific Shorts videos you want to watch
- **Cross-device Sync**: Synchronize your settings across multiple devices

## Installation

### For Users

1. Download the latest release from the [Releases](https://github.com/youtubeshortsblockr/extension/releases) page
2. Unzip the downloaded file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" by toggling the switch in the top-right corner
5. Click on "Load unpacked" and select the extracted folder
6. The extension icon should appear in your Chrome toolbar

### For Developers

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the extension:
   ```
   chmod +x build-extension.sh
   ./build-extension.sh
   ```
4. Load the `extension-build` directory into Chrome as an unpacked extension

## Usage

### Basic Features

1. Click on the extension icon in your Chrome toolbar to open the popup
2. Toggle "Hide Shorts" to remove Shorts from the YouTube interface
3. Toggle "Block Shorts" to prevent navigation to Shorts content
4. Click "Advanced Options" to access additional features

### Advanced Options

- **Custom Filters**: Create patterns to filter additional content
- **Category Filters**: Select content categories to filter
- **Whitelist**: Add specific Shorts URLs you want to allow
- **Statistics**: View how many Shorts have been blocked and hidden

## Development

This project consists of three main components:

1. **Extension UI**: Built with React and Tailwind CSS
2. **Content Script**: Handles DOM manipulation on YouTube pages
3. **Background Service**: Manages extension state and communicates with the server

### Project Structure

```
.
├── client/               # Extension frontend
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # React components
│       ├── content-scripts/ # Content scripts
│       ├── context/      # Context providers
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utility libraries
│       ├── pages/        # UI pages
│       ├── App.tsx       # Main component
│       ├── background.ts # Extension background script
│       └── main.tsx      # Entry point
├── server/               # Backend server
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage
│   └── index.ts          # Server entry point
├── shared/               # Shared resources
│   └── schema.ts         # Database schema
└── extension-build/      # Built extension files
```

### Development Workflow

1. Make changes to the code
2. Run `npm run dev` to start the development server
3. Run `./build-extension.sh` to build the extension
4. Reload the extension in Chrome to test changes

## Database Integration

The extension uses a PostgreSQL database to store settings and statistics, allowing for:

- Cross-device synchronization of settings
- Anonymous usage statistics for extension improvements
- Backup and recovery of user preferences

## Privacy

- All data is stored anonymously
- No personal information is collected
- Statistics are aggregated and cannot be traced to individuals
- The extension only requests the minimum permissions required

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues, please submit them on GitHub or contact us at support@youtubeshortsblockr.com.