#!/bin/bash

# Create extension build directory
mkdir -p extension-build

# Copy manifest file and icons (no need to wait for full build)
echo "Copying static files..."
cp client/public/manifest.json extension-build/
cp client/public/icon-*.svg extension-build/

# Create a simpler hot-reload.js without the deprecated getPackageDirectoryEntry
cat > extension-build/hot-reload.js << 'EOL'
// Simplified hot reload implementation for Chrome extensions
// This script will reload the extension when you click the extension icon
// This avoids the use of getPackageDirectoryEntry which is deprecated in Manifest V3

console.log('Hot reload for development mode is active');

const reload = () => {
  chrome.runtime.reload();
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
};

// Add reload option to the extension context menu during development
chrome.management.getSelf(self => {
  if (self.installType === 'development') {
    chrome.action.onClicked.addListener(() => {
      console.log('Extension icon clicked, triggering reload');
      reload();
    });
    
    // Listen for hot reload messages
    chrome.runtime.onMessage.addListener((message) => {
      if (message && message.action === 'hotReload') {
        reload();
      }
    });
  }
});
EOL

# Update manifest.json to use popup.html instead of index.html
echo "Updating manifest.json..."
sed -i 's/"default_popup": "index.html"/"default_popup": "popup.html"/g' extension-build/manifest.json
sed -i 's/"options_page": "index.html?page=options"/"options_ui": {"page": "popup.html", "open_in_tab": true}/g' extension-build/manifest.json
sed -i 's/"resources": \["index.html", "hot-reload.js"\]/"resources": \["popup.html", "hot-reload.js"\]/g' extension-build/manifest.json

# Create content-scripts directory
mkdir -p extension-build/content-scripts

# Build content scripts separately
echo "Building content scripts..."
npx esbuild client/src/content-scripts/youtube-blocker.ts --bundle --outfile=extension-build/content-scripts/youtube-blocker.js

# Build background script separately
echo "Building background script..."
npx esbuild client/src/background.ts --define:process.env.NODE_ENV=\"production\" --bundle --outfile=extension-build/background.js

# Copy popup HTML and create a simple build for it
echo "Creating popup interface..."
cat > extension-build/popup.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube Shorts Blocker</title>
  <style>
    body {
      width: 300px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .toggle-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 20px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    input:checked + .slider {
      background-color: #2196F3;
    }
    input:checked + .slider:before {
      transform: translateX(16px);
    }
    .advanced-link {
      display: block;
      text-align: center;
      color: #2196F3;
      text-decoration: none;
      margin-top: 12px;
      padding: 8px;
      border-radius: 4px;
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="icon-48.svg" width="24" height="24" alt="YouTube Shorts Blocker">
      <h1>YouTube Shorts Blocker</h1>
    </div>
    
    <div class="toggle-container">
      <span>Hide Shorts</span>
      <label class="switch">
        <input type="checkbox" id="hideShorts">
        <span class="slider"></span>
      </label>
    </div>
    
    <div class="toggle-container">
      <span>Block Shorts</span>
      <label class="switch">
        <input type="checkbox" id="blockShorts">
        <span class="slider"></span>
      </label>
    </div>
    
    <div id="options-section" class="toggle-container">
      <span>Advanced Options</span>
      <button id="options-button" class="advanced-link" style="background: none; border: none; cursor: pointer; color: #2196F3;">Open</button>
    </div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
EOL

# Create a simple popup.js
cat > extension-build/popup.js << 'EOL'
// Get elements
const hideShorts = document.getElementById('hideShorts');
const blockShorts = document.getElementById('blockShorts');
const optionsButton = document.getElementById('options-button');

// Load settings on popup open
chrome.storage.sync.get(['hideShorts', 'blockShorts'], (result) => {
  hideShorts.checked = result.hideShorts || false;
  blockShorts.checked = result.blockShorts || false;
});

// Function to safely send messages to tabs
function safelySendMessageToYoutubeTabs(message) {
  try {
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      if (tabs && tabs.length > 0) {
        tabs.forEach(tab => {
          if (tab && tab.id) {
            try {
              chrome.tabs.sendMessage(tab.id, message, () => {
                // Check for errors but ignore them - the content script may not be loaded yet
                if (chrome.runtime.lastError) {
                  console.log('Tab not ready:', chrome.runtime.lastError.message);
                }
              });
            } catch (err) {
              console.log('Error sending message to tab:', err);
            }
          }
        });
      }
    });
  } catch (err) {
    console.log('Error querying tabs:', err);
  }
}

// Save settings on toggle
hideShorts.addEventListener('change', () => {
  chrome.storage.sync.set({ hideShorts: hideShorts.checked });
  
  safelySendMessageToYoutubeTabs({
    action: 'updateSettings',
    hideShorts: hideShorts.checked,
    blockShorts: blockShorts.checked
  });
});

blockShorts.addEventListener('change', () => {
  chrome.storage.sync.set({ blockShorts: blockShorts.checked });
  
  safelySendMessageToYoutubeTabs({
    action: 'updateSettings',
    hideShorts: hideShorts.checked,
    blockShorts: blockShorts.checked
  });
});

// Open options page
optionsButton.addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});
EOL

# Create a basic options page
cat > extension-build/options.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube Shorts Blocker - Advanced Options</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .tabs {
      display: flex;
      margin-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    .tab {
      padding: 10px 20px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }
    .tab.active {
      border-bottom-color: #2196F3;
      color: #2196F3;
    }
    .content {
      margin-top: 20px;
    }
    .panel {
      display: none;
    }
    .panel.active {
      display: block;
    }
    h2 {
      margin-top: 0;
      font-size: 18px;
      font-weight: 500;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    input[type="text"] {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      padding: 8px 16px;
      background-color: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #0b7dda;
    }
    .filter-list {
      margin-top: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
    }
    .filter-item {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .filter-item:last-child {
      border-bottom: none;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .checkbox-group {
      margin-bottom: 16px;
    }
    .checkbox-container {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    .checkbox-container input {
      margin-right: 8px;
    }
    .stat-card {
      background-color: #f9f9f9;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      margin: 8px 0;
      color: #2196F3;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="icon-48.svg" width="32" height="32" alt="YouTube Shorts Blocker">
    <h1>YouTube Shorts Blocker - Advanced Options</h1>
  </div>
  
  <div class="tabs">
    <div class="tab active" data-tab="filters">Custom Filters</div>
    <div class="tab" data-tab="categories">Categories</div>
    <div class="tab" data-tab="whitelist">Whitelist</div>
    <div class="tab" data-tab="statistics">Statistics</div>
  </div>
  
  <div class="content">
    <!-- Custom Filters Panel -->
    <div class="panel active" id="filters-panel">
      <h2>Custom Filters</h2>
      <p>Create custom patterns to filter content beyond just Shorts.</p>
      
      <div class="form-group">
        <label for="filter-pattern">Filter Pattern:</label>
        <input type="text" id="filter-pattern" placeholder="E.g., '#trending' or 'live stream'">
      </div>
      
      <button id="add-filter">Add Filter</button>
      
      <div class="filter-list" id="custom-filters-list">
        <div class="filter-item">
          <span>No custom filters yet</span>
        </div>
      </div>
    </div>
    
    <!-- Categories Panel -->
    <div class="panel" id="categories-panel">
      <h2>Category Filters</h2>
      <p>Filter content by specific YouTube categories.</p>
      
      <div class="checkbox-group" id="category-list">
        <div class="checkbox-container">
          <input type="checkbox" id="cat-music">
          <label for="cat-music">Music</label>
        </div>
        <div class="checkbox-container">
          <input type="checkbox" id="cat-gaming">
          <label for="cat-gaming">Gaming</label>
        </div>
        <div class="checkbox-container">
          <input type="checkbox" id="cat-news">
          <label for="cat-news">News & Politics</label>
        </div>
        <div class="checkbox-container">
          <input type="checkbox" id="cat-howto">
          <label for="cat-howto">How-to & Style</label>
        </div>
      </div>
      
      <button id="save-categories">Save Categories</button>
    </div>
    
    <!-- Whitelist Panel -->
    <div class="panel" id="whitelist-panel">
      <h2>Whitelist</h2>
      <p>Allow specific Shorts videos that you want to watch.</p>
      
      <div class="form-group">
        <label for="whitelist-url">YouTube Shorts URL or ID:</label>
        <input type="text" id="whitelist-url" placeholder="E.g., https://youtube.com/shorts/abcd1234 or abcd1234">
      </div>
      
      <button id="add-whitelist">Add to Whitelist</button>
      
      <div class="filter-list" id="whitelist-items">
        <div class="filter-item">
          <span>No whitelisted items yet</span>
        </div>
      </div>
    </div>
    
    <!-- Statistics Panel -->
    <div class="panel" id="statistics-panel">
      <h2>Usage Statistics</h2>
      <p>Track how many Shorts have been blocked or hidden.</p>
      
      <div class="stat-card">
        <div>Shorts Blocked:</div>
        <div class="stat-number" id="shorts-blocked">0</div>
        <div>Times the extension prevented navigation to Shorts</div>
      </div>
      
      <div class="stat-card">
        <div>Shorts Hidden:</div>
        <div class="stat-number" id="shorts-hidden">0</div>
        <div>Shorts elements removed from the interface</div>
      </div>
      
      <button id="reset-stats">Reset Statistics</button>
    </div>
  </div>
  
  <script src="options.js"></script>
</body>
</html>
EOL

# Create options.js
cat > extension-build/options.js << 'EOL'
// Tab switching functionality
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;
    
    // Activate the tab
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show the panel
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById(`${targetTab}-panel`).classList.add('active');
  });
});

// Placeholder for demonstration - in a real extension this would connect to Chrome storage
document.getElementById('add-filter').addEventListener('click', () => {
  alert('Custom filter functionality would be implemented here');
});

document.getElementById('save-categories').addEventListener('click', () => {
  alert('Category filter functionality would be implemented here');
});

document.getElementById('add-whitelist').addEventListener('click', () => {
  alert('Whitelist functionality would be implemented here');
});

document.getElementById('reset-stats').addEventListener('click', () => {
  alert('Statistics reset would be implemented here');
});

// Load placeholder stats
document.getElementById('shorts-blocked').textContent = '0';
document.getElementById('shorts-hidden').textContent = '0';
EOL

# Update manifest to use options.html for options page
sed -i 's/"options_ui": {"page": "popup.html", "open_in_tab": true}/"options_ui": {"page": "options.html", "open_in_tab": true}/g' extension-build/manifest.json

# Ensure manifest references options.html correctly
sed -i 's/"resources": \["popup.html", "hot-reload.js"\]/"resources": \["popup.html", "options.html", "hot-reload.js"\]/g' extension-build/manifest.json

echo "Extension build complete! Your extension is ready in the extension-build directory."