#!/bin/bash

# First, build the extension
echo "Building extension..."
bash build-extension.sh

# Create a zip file for the extension
echo "Creating zip package..."
VERSION=$(grep -oP '"version": "\K[^"]+' extension-build/manifest.json)
ZIP_NAME="youtube-shorts-blocker-v$VERSION.zip"

# Remove any old zip file with the same name
if [ -f "$ZIP_NAME" ]; then
  rm "$ZIP_NAME"
fi

# Create the zip file
cd extension-build
zip -r "../$ZIP_NAME" *
cd ..

echo "Extension packaged as $ZIP_NAME"
echo "You can now distribute this file or upload it to the Chrome Web Store."