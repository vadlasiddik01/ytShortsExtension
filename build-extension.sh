#!/bin/bash

# Create extension build directory
mkdir -p extension-build

# Build the client-side React app
echo "Building React app..."
npm run build

# Copy necessary files for the extension
echo "Copying files to extension-build directory..."

# Copy the manifest file
cp client/public/manifest.json extension-build/

# Copy icon files
cp client/public/icon-*.svg extension-build/

# Copy the built client app
cp -r dist/public/* extension-build/

# Create content-scripts directory
mkdir -p extension-build/content-scripts

# Create a temporary production API client
echo "Preparing production API client..."
mkdir -p temp
cp client/src/lib/apiClient.ts temp/
sed -i 's#const API_BASE_URL = process.env.NODE_ENV === .production. ? .https://youtubeshortsblockr.replit.app/api. : ./api.#const API_BASE_URL = "https://youtubeshortsblockr.replit.app/api"#g' temp/apiClient.ts

# Build content scripts
echo "Building content scripts..."
npx esbuild client/src/content-scripts/youtube-blocker.ts --bundle --outfile=extension-build/content-scripts/youtube-blocker.js

# Build background script
echo "Building background script..."
npx esbuild client/src/background.ts --define:process.env.NODE_ENV=\"production\" --bundle --outfile=extension-build/background.js

# Clean up temporary files
rm -rf temp

echo "Extension build complete! Your extension is ready in the extension-build directory."