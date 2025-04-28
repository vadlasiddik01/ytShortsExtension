// YouTube Shorts Blocker Background Script
import { updateStatistics, resetStatistics as resetApiStatistics, saveSettings } from './lib/apiClient';

// Import hot-reload in development mode
try {
  if (chrome.management) {
    chrome.management.getSelf(self => {
      if (self.installType === 'development') {
        // Load hot-reload script
        import('../public/hot-reload.js')
          .then(() => console.log('Hot reload activated!'))
          .catch(err => console.error('Hot reload failed:', err));
      }
    });
  }
} catch (error) {
  console.log('Hot reload not available in this environment');
}

// Settings interface for type safety
interface BlockerSettings {
  hideShorts?: boolean;
  blockShorts?: boolean;
  customFilters?: FilterRule[];
  categoryFilters?: string[];
  useStatistics?: boolean;
  whitelist?: string[];
}

// Filter rule interface
interface FilterRule {
  id: string;
  pattern: string;
  enabled: boolean;
}

// Statistics interface
interface Statistics {
  shortsBlocked: number;
  shortsHidden: number;
  lastReset: number;
}

// Message interface for type safety
interface SettingsMessage {
  action: string;
  hideShorts?: boolean;
  blockShorts?: boolean;
  customFilters?: FilterRule[];
  categoryFilters?: string[];
  whitelist?: string[];
  useStatistics?: boolean;
  statsType?: string;
  shortsId?: string;
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
    blockShorts: false,
    customFilters: [
      { id: 'default-1', pattern: 'Shorts shelf', enabled: true },
      { id: 'default-2', pattern: 'Shorts feed', enabled: true },
    ],
    categoryFilters: [],
    useStatistics: true,
    whitelist: []
  }, () => {
    console.log('YouTube Shorts Blocker initialized with default settings');
  });

  // Initialize statistics
  chrome.storage.local.set({
    statistics: {
      shortsBlocked: 0,
      shortsHidden: 0,
      lastReset: Date.now()
    }
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message: SettingsMessage, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    chrome.storage.sync.get(
      {
        hideShorts: true,
        blockShorts: false,
        customFilters: [],
        categoryFilters: [],
        useStatistics: true,
        whitelist: []
      },
      (settings: BlockerSettings) => {
        sendResponse(settings);
      }
    );
    return true; // Required for async sendResponse
  }
  
  // Track statistics for shorts that are blocked or hidden
  if (message.action === 'trackStatistic' && message.statsType && message.shortsId) {
    chrome.storage.sync.get({ useStatistics: true, installationId: '' }, (settings) => {
      if (settings.useStatistics) {
        chrome.storage.local.get({ statistics: { shortsBlocked: 0, shortsHidden: 0, lastReset: Date.now() } }, 
          async (data) => {
            const statistics: Statistics = data.statistics;
            let blockedDelta = 0;
            let hiddenDelta = 0;
            
            if (message.statsType === 'blocked') {
              statistics.shortsBlocked++;
              blockedDelta = 1;
            } else if (message.statsType === 'hidden') {
              statistics.shortsHidden++;
              hiddenDelta = 1;
            }
            
            // Update local storage
            chrome.storage.local.set({ statistics });
            
            // Update statistics in the database if we have an installation ID
            if (settings.installationId) {
              try {
                await updateStatistics(settings.installationId, blockedDelta, hiddenDelta);
              } catch (error) {
                console.error('Error updating statistics in database:', error);
              }
            }
          }
        );
      }
    });
    return true;
  }
  
  // Check if a video is in the whitelist
  if (message.action === 'checkWhitelist' && message.shortsId) {
    chrome.storage.sync.get({ whitelist: [] }, (settings) => {
      const isWhitelisted = settings.whitelist.includes(message.shortsId);
      sendResponse({ isWhitelisted });
    });
    return true;
  }
  
  // Add a video to the whitelist
  if (message.action === 'addToWhitelist' && message.shortsId) {
    chrome.storage.sync.get({ whitelist: [], installationId: '' }, async (settings) => {
      if (!settings.whitelist.includes(message.shortsId)) {
        const whitelist = [...settings.whitelist, message.shortsId];
        chrome.storage.sync.set({ whitelist });
        
        // Save whitelist to database if we have an installation ID
        if (settings.installationId) {
          try {
            await saveSettings(settings.installationId, { whitelist });
          } catch (error) {
            console.error('Error saving whitelist to database:', error);
          }
        }
      }
      sendResponse({ success: true });
    });
    return true;
  }
  
  // Remove a video from the whitelist
  if (message.action === 'removeFromWhitelist' && message.shortsId) {
    chrome.storage.sync.get({ whitelist: [], installationId: '' }, async (settings) => {
      const whitelist = settings.whitelist.filter(id => id !== message.shortsId);
      chrome.storage.sync.set({ whitelist });
      
      // Save updated whitelist to database if we have an installation ID
      if (settings.installationId) {
        try {
          await saveSettings(settings.installationId, { whitelist });
        } catch (error) {
          console.error('Error saving whitelist to database:', error);
        }
      }
      
      sendResponse({ success: true });
    });
    return true;
  }
  
  // Get statistics
  if (message.action === 'getStatistics') {
    chrome.storage.local.get({ statistics: { shortsBlocked: 0, shortsHidden: 0, lastReset: Date.now() } }, 
      (data) => {
        sendResponse(data.statistics);
      }
    );
    return true;
  }
  
  // Reset statistics
  if (message.action === 'resetStatistics') {
    chrome.storage.sync.get({ installationId: '' }, async (settings) => {
      const newStats = {
        shortsBlocked: 0,
        shortsHidden: 0,
        lastReset: Date.now()
      };
      
      // Reset in local storage
      chrome.storage.local.set({ statistics: newStats });
      
      // Reset in database if we have an installation ID
      if (settings.installationId) {
        try {
          await resetApiStatistics(settings.installationId);
        } catch (error) {
          console.error('Error resetting statistics in database:', error);
        }
      }
      
      sendResponse({ success: true });
    });
    return true;
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
