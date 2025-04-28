# Publishing to the Chrome Web Store

This document outlines the steps required to publish the YouTube Shorts Blocker extension to the Chrome Web Store.

## Prerequisites

1. A Google Developer account with access to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. A one-time registration fee of $5 (if you haven't published before)
3. The packaged extension (`youtube-shorts-blocker-v{version}.zip`)
4. Promotional images and descriptions ready

## Step 1: Prepare Store Listing Assets

Before uploading your extension, prepare the following assets:

### Required Items

- **Extension ZIP file**: Created using the `package-extension.sh` script
- **Store Icon**: 128x128px PNG image
- **Detailed Description**: Up to 16,000 characters describing the extension
- **Screenshots**: At least 1, up to 5 screenshots (1280x800px or 640x400px)
- **Privacy Policy**: A link to your privacy policy

### Optional Items

- **Promotional Images**:
  - Small Promo Tile: 440x280px
  - Marquee Promo Tile: 1400x560px
  - Large Promo Tile: 920x680px
- **YouTube Video**: A demonstration of your extension
- **Homepage URL**: Link to your project homepage

## Step 2: Create a New Item in the Developer Dashboard

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Click on "Add new item"
3. Upload your packaged extension ZIP file
4. Wait for the package to be uploaded and validated

## Step 3: Fill in the Store Listing Information

Complete all the required fields in the Developer Dashboard:

### Store Listing Tab

1. **Name**: "YouTube Shorts Blocker"
2. **Summary**: A brief one-line description (132 characters max)
3. **Detailed Description**: Comprehensive description of the extension
4. **Category**: Choose "Productivity" or "Tools"
5. **Language**: Select the primary language
6. **Icon**: Upload your 128x128px icon
7. **Screenshots**: Upload 1-5 screenshots
8. **Additional Fields**: Complete any other required fields

### Privacy Tab

1. **Privacy Policy**: Provide a link to your privacy policy
2. **Permissions Justification**: Explain why your extension needs each permission

### Distribution Tab

1. **Visibility Options**: Choose between:
   - Public (visible to all Chrome Web Store users)
   - Unlisted (accessible via direct link only)
   - Private (limited to specific Google accounts)
2. **Distribution Locations**: Select where you want your extension to be available

## Step 4: Submit for Review

1. Ensure all required fields are completed (look for green checkmarks)
2. Click on "Submit for review"
3. Choose between "Standard" or "Expedited" review (if available)
4. Confirm submission

## Step 5: Wait for Approval

1. The review process typically takes several business days
2. You'll receive an email notification when the review is complete
3. If rejected, you'll receive feedback on what needs to be fixed

## Step 6: Post-Publication

After your extension is published:

1. Monitor user feedback and ratings
2. Address any issues in timely updates
3. Keep your extension up-to-date with Chrome's evolving requirements

## Chrome Web Store Policies

Ensure your extension complies with all [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/), including:

- Single Purpose: Extensions should have a narrow, easy-to-understand purpose
- Data Privacy: Clear disclosure of data collection and user privacy protections
- Content Policies: No offensive or harmful content
- Functionality: The extension must function as described

## Updating Your Extension

When you release a new version:

1. Update the version number in `manifest.json`
2. Run the packaging script to create a new ZIP file
3. In the Developer Dashboard, select your extension
4. Click "Package" > "Upload new package"
5. Submit for review again

Updates to existing extensions typically have a shorter review time.

---

For more detailed information, visit the [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/).