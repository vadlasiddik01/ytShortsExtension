// YouTube Shorts Blocker Background Script

// Settings interface for type safety
interface BlockerSettings {
  hideShorts?: boolean;
  blockShorts?: boolean;
}

// Message interface for type safety
interface SettingsMessage {
  action: string;
  hideShorts?: boolean;
  blockShorts?: boolean;
}

// Tab info interface
interface TabInfo {
  id?: number;
  url?: string;
  status?: string;
}

// Change info interface
interface ChangeInfo {
  status?: string;
  url?: string;
}

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
chrome.runtime.onMessage.addListener((message: SettingsMessage, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    chrome.storage.sync.get(
      {
        hideShorts: true,
        blockShorts: false
      },
      (settings: BlockerSettings) => {
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
    (settings: BlockerSettings) => {
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
chrome.storage.onChanged.addListener((changes: { [key: string]: any }) => {
  if (changes.hideShorts || changes.blockShorts) {
    updateBadgeStatus();
  }
});

// Update badge on startup
updateBadgeStatus();

// Execute content script when navigating to YouTube
chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: ChangeInfo, tab: TabInfo) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
    // Check if we should apply settings immediately
    chrome.storage.sync.get(
      {
        hideShorts: true,
        blockShorts: false
      },
      (settings: BlockerSettings) => {
        // If either setting is enabled, ensure our content script is running
        if (settings.hideShorts || settings.blockShorts) {
          // Send message to content script to update settings
          chrome.tabs.sendMessage(tabId, { 
            action: 'settingsUpdated', 
            hideShorts: settings.hideShorts,
            blockShorts: settings.blockShorts
          }, (response: any) => {
            // If no response, the content script might not be loaded yet, so inject it
            if (chrome.runtime.lastError) {
              console.log('Content script not ready, injecting it');
              chrome.scripting.executeScript({
                target: { tabId },
                files: ['content-scripts/youtube-blocker.js']
              }).catch(error => {
                console.error('Error injecting content script:', error);
              });
            }
          });
        }
      }
    );
  }
});
