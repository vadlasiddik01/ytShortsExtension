// YouTube Shorts Blocker Background Script

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.set({
    hideShorts: true,
    blockShorts: false
  }, () => {
    console.log('YouTube Shorts Blocker initialized with default settings');
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    chrome.storage.sync.get(
      {
        hideShorts: true,
        blockShorts: false
      },
      (settings) => {
        sendResponse(settings);
      }
    );
    return true; // Required for async sendResponse
  }
});

// Extension icon badge setup
function updateBadgeStatus() {
  chrome.storage.sync.get(
    {
      hideShorts: true,
      blockShorts: false
    },
    (settings) => {
      const isActive = settings.hideShorts || settings.blockShorts;
      
      // Update badge color based on active state
      if (isActive) {
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' }); // YouTube red
        chrome.action.setBadgeText({ text: 'ON' });
      } else {
        chrome.action.setBadgeBackgroundColor({ color: '#AAAAAA' }); // Gray
        chrome.action.setBadgeText({ text: 'OFF' });
      }
    }
  );
}

// Update badge when settings change
chrome.storage.onChanged.addListener((changes) => {
  if (changes.hideShorts || changes.blockShorts) {
    updateBadgeStatus();
  }
});

// Update badge on startup
updateBadgeStatus();

// Execute content script when navigating to YouTube
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-scripts/youtube-blocker.js']
    }).catch(error => {
      console.error('Error injecting content script:', error);
    });
  }
});
