// YouTube Shorts Blocker Content Script

// Define element selectors for YouTube Shorts - updated for 2025
const YOUTUBE_SELECTORS = {
  // Sidebar Shorts icon and label (multiple selectors to ensure coverage)
  SIDEBAR_SHORTS: `
    ytd-guide-entry-renderer:has(a[title="Shorts"]), 
    ytd-guide-entry-renderer:has(a[href="/shorts"]),
    tp-yt-paper-item:has(yt-formatted-string:contains("Shorts")),
    yt-chip-cloud-chip-renderer:has([href*="/shorts"])
  `,
  
  // Shorts section in the home feed
  FEED_SHORTS_SHELF: `
    ytd-rich-section-renderer:has(#title:contains("Shorts")),
    ytd-rich-section-renderer:has(#header-text:contains("Shorts")),
    ytd-rich-section-renderer:has(.ytd-rich-section-renderer:contains("Shorts")),
    ytd-reel-shelf-renderer
  `,
  FEED_SHORTS_MINI_SHELF: `
    ytd-reel-shelf-renderer,
    ytd-rich-grid-renderer:has(#title:contains("Shorts")),
    ytd-rich-section-renderer:has(a[href*="/shorts"])
  `,
  
  // Individual Shorts in grid format
  SHORTS_GRID_ITEMS: `
    ytd-grid-video-renderer:has(a[href*="/shorts/"]),
    ytd-rich-item-renderer:has(a[href*="/shorts/"]),
    ytd-video-renderer:has(a[href*="/shorts/"])
  `,
  
  // Individual Shorts in the suggestions panel
  SHORTS_SUGGESTIONS: `
    ytd-compact-video-renderer:has(a[href*="/shorts/"]),
    ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-compact-radio-renderer:has(a[href*="/shorts/"]),
    ytd-item-section-renderer:has(a[href*="/shorts/"])
  `,
  
  // Shorts in the search results
  SHORTS_SEARCH_RESULTS: `
    ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-item-section-renderer:has(a[href*="/shorts/"]),
    ytd-shelf-renderer:has(a[href*="/shorts/"])
  `,
  
  // Shorts thumbnails in various formats
  SHORTS_THUMBNAILS: `
    a[href*="/shorts/"],
    ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"],
    yt-formatted-string:has-text("Shorts")
  `,
  
  // Video categories (for filtering)
  VIDEO_CATEGORY: `
    ytd-video-renderer:has(#video-title:contains("{category}")),
    ytd-compact-video-renderer:has(#video-title:contains("{category}"))
  `,
  
  // Video category metadata
  CATEGORY_CHIP: `
    #text.ytd-channel-name:contains("{category}"),
    yt-formatted-string:contains("{category}")
  `,
  
  // Shorts player on /shorts/ page 
  SHORTS_PLAYER: `
    ytd-shorts, 
    ytd-shorts-player-renderer,
    ytd-reel-video-renderer,
    shorts-video
  `
};

// Interface for custom filter rule
interface FilterRule {
  id: string;
  pattern: string;
  enabled: boolean;
}

// Interface for settings
interface BlockerSettings {
  hideShorts?: boolean;
  blockShorts?: boolean;
  customFilters?: FilterRule[];
  categoryFilters?: string[];
  useStatistics?: boolean;
  whitelist?: string[];
}

// CSS to inject for hiding Shorts
const HIDE_SHORTS_CSS = `
  /* Hide Shorts from sidebar */
  ${YOUTUBE_SELECTORS.SIDEBAR_SHORTS} {
    display: none !important;
  }
  
  /* Hide Shorts shelf from feed */
  ${YOUTUBE_SELECTORS.FEED_SHORTS_SHELF},
  ${YOUTUBE_SELECTORS.FEED_SHORTS_MINI_SHELF} {
    display: none !important;
  }
  
  /* Hide individual Shorts items */
  ${YOUTUBE_SELECTORS.SHORTS_GRID_ITEMS},
  ${YOUTUBE_SELECTORS.SHORTS_SUGGESTIONS},
  ${YOUTUBE_SELECTORS.SHORTS_SEARCH_RESULTS} {
    display: none !important;
  }
  
  /* Hide any elements containing Shorts in the text */
  yt-formatted-string:contains("Shorts"),
  span:contains("Shorts"),
  div[aria-label*="Shorts"],
  a[aria-label*="Shorts"] {
    display: none !important;
  }
  
  /* Hide anything with "shorts" in the class or id */
  [class*="shorts"],
  [id*="shorts"],
  [data-content-type="shorts"] {
    display: none !important;
  }
  
  /* Hide shorts player */
  ${YOUTUBE_SELECTORS.SHORTS_PLAYER} {
    display: none !important;
  }
  
  /* Hide elements with shorts URL */
  a[href*="/shorts/"] {
    display: none !important;
  }
  
  /* Hide shorts chips and tabs */
  yt-chip-cloud-chip-renderer[chip-style="STYLE_HOME_FILTER"][title="Shorts"],
  yt-chip-cloud-chip-renderer:has(span:contains("Shorts")),
  tp-yt-paper-tab:has(yt-formatted-string:contains("Shorts")) {
    display: none !important;
  }
`;

// Function to create and inject CSS
function injectCSS(cssText: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.id = 'yt-shorts-blocker-style';
  style.textContent = cssText;
  document.head.appendChild(style);
  return style;
}

// Function to remove injected CSS
function removeInjectedCSS(): void {
  // Remove main blocking style
  const styleElement = document.getElementById('yt-shorts-blocker-style');
  if (styleElement) {
    styleElement.remove();
  }
  
  // Remove custom filter styles
  const customFilterStyle = document.getElementById('yt-shorts-custom-filters-style');
  if (customFilterStyle) {
    customFilterStyle.remove();
  }
  
  // Remove category filter styles
  const categoryFilterStyle = document.getElementById('yt-category-filters-style');
  if (categoryFilterStyle) {
    categoryFilterStyle.remove();
  }
}

// Function to block clicking on Shorts links
function blockShortsLinks(enabled?: boolean): void {
  console.log('YouTube Shorts Blocker: Setting up click blocking:', enabled);
  
  if (enabled !== true) {
    // Remove existing event listeners by replacing cloned elements
    document.querySelectorAll('[data-shorts-blocked="true"]').forEach(element => {
      try {
        const clone = element.cloneNode(true) as HTMLElement;
        clone.removeAttribute('data-shorts-blocked');
        element.parentNode?.replaceChild(clone, element);
      } catch (err) {
        console.error('Error removing shorts blocks:', err);
      }
    });
    
    // Also remove global click handler if it exists
    if ((window as any).globalShortsBlockHandler) {
      document.removeEventListener('click', (window as any).globalShortsBlockHandler, true);
      delete (window as any).globalShortsBlockHandler;
    }
    
    return;
  }

  // Function to intercept clicks - more aggressive with path detection
  const blockClickHandler = (event: Event) => {
    // Check if the click target or any of its parents is a link to shorts
    let element = event.target as HTMLElement;
    let shortsLinkDetected = false;
    
    // Go up the DOM tree to find the closest anchor element
    while (element && !shortsLinkDetected) {
      if (element.tagName === 'A') {
        const href = element.getAttribute('href');
        if (href && href.includes('/shorts/')) {
          shortsLinkDetected = true;
          break;
        }
      }
      
      // Check for data attributes that might indicate shorts
      if (element.dataset && 
         (element.dataset.contentType === 'shorts' || 
          element.classList.contains('shorts') || 
          element.id.includes('shorts'))) {
        shortsLinkDetected = true;
        break;
      }
      
      element = element.parentElement as HTMLElement;
    }
    
    if (shortsLinkDetected) {
      event.preventDefault();
      event.stopPropagation();
      console.log('YouTube Shorts Blocker: Prevented navigation to Shorts');
      
      // Show a notification to the user
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.top = '60px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      notification.style.color = 'white';
      notification.style.padding = '10px 15px';
      notification.style.borderRadius = '4px';
      notification.style.zIndex = '9999';
      notification.style.fontWeight = 'bold';
      notification.style.fontSize = '14px';
      notification.textContent = 'Shorts Blocked by YouTube Shorts Blocker';
      
      document.body.appendChild(notification);
      
      // Remove notification after 2 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 2000);
      
      return false;
    }
  };

  // Register global click handler for the entire document
  if (!(window as any).globalShortsBlockHandler) {
    (window as any).globalShortsBlockHandler = blockClickHandler;
    document.addEventListener('click', blockClickHandler, true);
  }

  // Add specific markers to shorts links for styling
  const addBlockers = () => {
    document.querySelectorAll(YOUTUBE_SELECTORS.SHORTS_THUMBNAILS).forEach(element => {
      if (!(element as HTMLElement).dataset.shortsBlocked) {
        (element as HTMLElement).dataset.shortsBlocked = 'true';
        
        // Add visual indicator
        try {
          const parent = element.closest('ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, ytd-compact-video-renderer');
          if (parent) {
            (parent as HTMLElement).style.position = 'relative';
            
            const indicator = document.createElement('div');
            indicator.textContent = 'SHORTS BLOCKED';
            indicator.style.position = 'absolute';
            indicator.style.top = '0';
            indicator.style.left = '0';
            indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            indicator.style.color = 'white';
            indicator.style.padding = '2px 5px';
            indicator.style.fontSize = '10px';
            indicator.style.zIndex = '100';
            indicator.style.pointerEvents = 'none';
            
            parent.appendChild(indicator);
          }
        } catch (err) {
          console.warn('Could not add visual indicator:', err);
        }
      }
    });
  };

  // Initial run
  addBlockers();

  // Set up observer to handle dynamically loaded content
  const observer = new MutationObserver(mutations => {
    let shouldCheck = false;
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldCheck = true;
      }
    });

    if (shouldCheck) {
      addBlockers();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Store the observer to disconnect later if needed
  (window as any).shortsBlockerObserver = observer;
}

// Function to clean up observers
function cleanupObservers(): void {
  if ((window as any).shortsBlockerObserver) {
    (window as any).shortsBlockerObserver.disconnect();
    delete (window as any).shortsBlockerObserver;
  }
}

// Main function to apply settings
function applySettings(hideShorts?: boolean, blockShorts?: boolean): void {
  // Apply or remove CSS for hiding Shorts
  if (hideShorts === true) {
    if (!document.getElementById('yt-shorts-blocker-style')) {
      injectCSS(HIDE_SHORTS_CSS);
    }
  } else {
    removeInjectedCSS();
  }

  // Apply or remove click blocking for Shorts
  blockShortsLinks(blockShorts === true);
}

// Function to block Shorts URL by redirecting to homepage
function blockShortsURL(): void {
  console.log('YouTube Shorts Blocker: Checking if current URL is a Shorts URL...');
  
  // More aggressive shorts detection
  const isShorts = window.location.pathname.includes('/shorts/') || 
                  document.querySelector(YOUTUBE_SELECTORS.SHORTS_PLAYER) !== null;
  
  if (isShorts) {
    console.log('YouTube Shorts Blocker: Detected Shorts page, redirecting to homepage');
    
    // Try to modify the DOM to hide shorts before redirecting
    try {
      // Add immediate styles to hide shorts content
      const shortsHidingStyle = document.createElement('style');
      shortsHidingStyle.textContent = `
        ${YOUTUBE_SELECTORS.SHORTS_PLAYER} { 
          display: none !important; 
          visibility: hidden !important;
        }
        
        /* Hide any shorts container */
        [class*="shorts"], [id*="shorts"] {
          display: none !important;
        }
        
        /* Create overlay to prevent interaction */
        body::before {
          content: "Blocking Shorts - Redirecting...";
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
      `;
      document.head.appendChild(shortsHidingStyle);
      
      // Redirect after a very short delay
      setTimeout(() => {
        window.location.href = 'https://www.youtube.com/';
      }, 50);
    } catch (err) {
      console.error('Error blocking shorts:', err);
      // If the DOM modification fails, just redirect
      window.location.href = 'https://www.youtube.com/';
    }
  }
}

// Message interface for better type safety
interface SettingsMessage {
  action: string;
  hideShorts?: boolean;
  blockShorts?: boolean;
  customFilters?: FilterRule[];
  categoryFilters?: string[];
  whitelist?: string[];
  shortsId?: string;
  statsType?: string;
}

// Function to apply custom filter rules
function applyCustomFilters(filters: FilterRule[]): void {
  // Only process enabled filters
  const enabledFilters = filters.filter(f => f.enabled);
  if (enabledFilters.length === 0) return;
  
  // Create CSS for custom filters
  let customFilterCSS = '';
  enabledFilters.forEach(filter => {
    // Create a safe selector from the pattern
    const safePattern = filter.pattern.replace(/"/g, '\\"');
    customFilterCSS += `
      /* Custom filter: ${filter.pattern} */
      [title*="${safePattern}"],
      span:contains("${safePattern}"),
      yt-formatted-string:contains("${safePattern}") {
        opacity: 0.3;
        position: relative;
      }
      
      [title*="${safePattern}"]:before,
      span:contains("${safePattern}"):before,
      yt-formatted-string:contains("${safePattern}"):before {
        content: "Filtered: ${safePattern}";
        position: absolute;
        top: 0;
        left: 0;
        background: rgba(255, 0, 0, 0.7);
        color: white;
        padding: 2px 5px;
        font-size: 10px;
        z-index: 9999;
      }
    `;
  });
  
  // Inject the custom filter CSS
  if (customFilterCSS) {
    const style = document.createElement('style');
    style.id = 'yt-shorts-custom-filters-style';
    style.textContent = customFilterCSS;
    document.head.appendChild(style);
  }
}

// Function to apply category filters
function applyCategoryFilters(categories: string[]): void {
  if (!categories.length) return;
  
  let categoryFilterCSS = '';
  categories.forEach(category => {
    const selector = YOUTUBE_SELECTORS.VIDEO_CATEGORY.replace('{category}', category);
    const chipSelector = YOUTUBE_SELECTORS.CATEGORY_CHIP.replace('{category}', category);
    
    categoryFilterCSS += `
      /* Category filter: ${category} */
      ${selector},
      ${chipSelector} {
        display: none !important;
      }
    `;
  });
  
  // Inject the category filter CSS
  if (categoryFilterCSS) {
    const style = document.createElement('style');
    style.id = 'yt-category-filters-style';
    style.textContent = categoryFilterCSS;
    document.head.appendChild(style);
  }
}

// Function to check if we're on a YouTube page and initialize the blocker
function initBlocker(): void {
  if (document.location.hostname.includes('youtube.com')) {
    try {
      // Get settings from Chrome storage
      const defaultSettings: BlockerSettings = {
        hideShorts: true,  // Default
        blockShorts: false, // Default
        customFilters: [],
        categoryFilters: [],
        useStatistics: true,
        whitelist: []
      };
      
      // First try to get settings, with appropriate error handling
      try {
        chrome.storage.sync.get<BlockerSettings>(
          defaultSettings,
          (settings) => {
            try {
              // Check if current shorts URL is whitelisted
              const currentUrl = window.location.href;
              const shortsId = getShortsIdFromUrl(currentUrl);
              
              if (shortsId && settings.whitelist?.includes(shortsId)) {
                console.log(`Shorts ${shortsId} is whitelisted, not blocking.`);
                return; // Don't apply blocking to whitelisted shorts
              }
              
              // Apply basic settings
              applySettings(settings.hideShorts, settings.blockShorts);
              
              // Apply custom filters if any
              if (settings.customFilters && settings.customFilters.length > 0) {
                applyCustomFilters(settings.customFilters);
              }
              
              // Apply category filters if any
              if (settings.categoryFilters && settings.categoryFilters.length > 0) {
                applyCategoryFilters(settings.categoryFilters);
              }
              
              // Track statistics for blocked content
              if (settings.blockShorts === true && shortsId) {
                const isShorts = window.location.pathname.includes('/shorts/');
                if (isShorts) {
                  trackShortsStatistic('blocked', shortsId);
                }
              }
              
              // If block is enabled, check URL
              if (settings.blockShorts === true) {
                blockShortsURL();
              }
            } catch (err) {
              console.error('Error in settings callback:', err);
              // Apply default settings if something goes wrong
              applySettings(true, false);
            }
          }
        );
      } catch (err) {
        console.error('Error accessing Chrome storage:', err);
        // Apply default settings if Chrome storage is inaccessible
        applySettings(true, false);
      }
    } catch (err) {
      console.error('Critical error in initBlocker:', err);
      // Even if everything fails, at least try to apply default settings
      try {
        applySettings(true, false);
      } catch (finalErr) {
        console.error('Could not apply default settings:', finalErr);
      }
    }
  }
}

// Helper function to extract Shorts ID from URL
function getShortsIdFromUrl(url: string): string | null {
  const match = url.match(/\/shorts\/([^/?&]+)/);
  return match ? match[1] : null;
}

// Function to track shorts statistics
function trackShortsStatistic(type: string, shortsId: string): void {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      chrome.runtime.sendMessage({
        action: 'trackStatistic',
        statsType: type,
        shortsId
      }, (response) => {
        // Handle response if needed and ignore chrome.runtime.lastError
        if (chrome.runtime.lastError) {
          console.log('Error in trackShortsStatistic:', chrome.runtime.lastError.message);
          // Extension may have been reloaded, we can silently fail
        }
      });
    } catch (error) {
      // Extension context may have been invalidated
      console.error('Error tracking statistic:', error);
    }
  }
}

// Function to check if a shorts video is whitelisted
async function isWhitelisted(shortsId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage(
          { action: 'checkWhitelist', shortsId },
          (response) => {
            if (chrome.runtime.lastError) {
              console.log('Error checking whitelist:', chrome.runtime.lastError.message);
              resolve(false);
              return;
            }
            resolve(response?.isWhitelisted || false);
          }
        );
      } catch (error) {
        // Extension context may have been invalidated
        console.error('Error checking whitelist:', error);
        resolve(false);
      }
    } else {
      resolve(false);
    }
  });
}

// Listen for messages from the popup or background script
try {
  chrome.runtime.onMessage.addListener((message: SettingsMessage, sender, sendResponse) => {
    try {
      if (message.action === 'settingsUpdated') {
        // Apply basic settings
        applySettings(message.hideShorts, message.blockShorts);
        
        // If block is enabled, check URL
        if (message.blockShorts === true) {
          blockShortsURL();
        }
        
        // Apply custom filters if provided
        if (message.customFilters && message.customFilters.length > 0) {
          applyCustomFilters(message.customFilters);
        }
        
        // Apply category filters if provided
        if (message.categoryFilters && message.categoryFilters.length > 0) {
          applyCategoryFilters(message.categoryFilters);
        }
        
        // Send success response
        if (sendResponse) {
          sendResponse({ success: true });
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error handling message:', error);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message || 'Unknown error occurred' });
      }
    }
    return true;
  });
} catch (error) {
  console.error('Error setting up message listener:', error);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initBlocker);

// Also run now in case DOM is already loaded
initBlocker();

// Run again when navigation happens within YouTube (SPA)
window.addEventListener('yt-navigate-finish', () => {
  console.log('YouTube navigation detected, reapplying settings');
  initBlocker();
});

// Also listen for navigation events the standard way
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('URL changed to', url);
    initBlocker();
  }
}).observe(document, { subtree: true, childList: true });

// Cleanup when the content script is unloaded
window.addEventListener('unload', () => {
  cleanupObservers();
  removeInjectedCSS();
});
