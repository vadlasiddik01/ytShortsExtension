// YouTube Shorts Blocker Content Script

// Define element selectors for YouTube Shorts
const YOUTUBE_SELECTORS = {
  // Sidebar Shorts icon and label
  SIDEBAR_SHORTS: 'ytd-guide-entry-renderer:has(a[title="Shorts"])',
  
  // Shorts section in the home feed
  FEED_SHORTS_SHELF: 'ytd-rich-section-renderer:has(#title:has-text("Shorts"))',
  FEED_SHORTS_MINI_SHELF: 'ytd-reel-shelf-renderer',
  
  // Individual Shorts in grid format
  SHORTS_GRID_ITEMS: 'ytd-grid-video-renderer:has(a[href*="/shorts/"])',
  
  // Individual Shorts in the suggestions panel
  SHORTS_SUGGESTIONS: 'ytd-compact-video-renderer:has(a[href*="/shorts/"])',
  
  // Shorts in the search results
  SHORTS_SEARCH_RESULTS: 'ytd-video-renderer:has(a[href*="/shorts/"])',
  
  // Shorts thumbnails in various formats
  SHORTS_THUMBNAILS: 'a[href*="/shorts/"]',
  
  // Video categories (for filtering)
  VIDEO_CATEGORY: 'ytd-video-renderer:has(#video-title:has-text("{category}"))',
  
  // Video category metadata
  CATEGORY_CHIP: '#text.ytd-channel-name:contains("{category}")',
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
  if (enabled !== true) {
    // Remove existing event listeners by replacing cloned elements
    document.querySelectorAll('[data-shorts-blocked="true"]').forEach(element => {
      const clone = element.cloneNode(true) as HTMLElement;
      clone.removeAttribute('data-shorts-blocked');
      element.parentNode?.replaceChild(clone, element);
    });
    return;
  }

  // Function to intercept clicks
  const blockClickHandler = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('YouTube Shorts Blocker: Prevented navigation to Shorts');
    return false;
  };

  // Add click handlers to all Shorts links
  const addBlockers = () => {
    document.querySelectorAll(YOUTUBE_SELECTORS.SHORTS_THUMBNAILS).forEach(element => {
      if (!(element as HTMLElement).dataset.shortsBlocked) {
        element.addEventListener('click', blockClickHandler, true);
        (element as HTMLElement).dataset.shortsBlocked = 'true';
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
  if (window.location.pathname.includes('/shorts/')) {
    window.location.href = 'https://www.youtube.com/';
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
    // Get settings from Chrome storage
    chrome.storage.sync.get<BlockerSettings>(
      {
        hideShorts: true,  // Default
        blockShorts: false, // Default
        customFilters: [],
        categoryFilters: [],
        useStatistics: true,
        whitelist: []
      },
      (settings) => {
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
      }
    );
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
      });
    } catch (error) {
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
            resolve(response?.isWhitelisted || false);
          }
        );
      } catch (error) {
        console.error('Error checking whitelist:', error);
        resolve(false);
      }
    } else {
      resolve(false);
    }
  });
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message: SettingsMessage) => {
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
  }
  return true;
});

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
