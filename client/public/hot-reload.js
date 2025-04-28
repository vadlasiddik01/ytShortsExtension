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
try {
  // Simplified development detection
  const isDevelopment = !chrome.runtime.id.startsWith('a');
  
  if (isDevelopment) {
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
} catch (error) {
  console.log('Hot reload not available in this environment');
}