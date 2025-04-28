"use strict";
(() => {
  // client/src/content-scripts/youtube-blocker.ts
  var YOUTUBE_SELECTORS = {
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
  var HIDE_SHORTS_CSS = `
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
  function injectCSS(cssText) {
    const style = document.createElement("style");
    style.id = "yt-shorts-blocker-style";
    style.textContent = cssText;
    document.head.appendChild(style);
    return style;
  }
  function removeInjectedCSS() {
    const styleElement = document.getElementById("yt-shorts-blocker-style");
    if (styleElement) {
      styleElement.remove();
    }
    const customFilterStyle = document.getElementById("yt-shorts-custom-filters-style");
    if (customFilterStyle) {
      customFilterStyle.remove();
    }
    const categoryFilterStyle = document.getElementById("yt-category-filters-style");
    if (categoryFilterStyle) {
      categoryFilterStyle.remove();
    }
  }
  function blockShortsLinks(enabled) {
    console.log("YouTube Shorts Blocker: Setting up click blocking:", enabled);
    if (enabled !== true) {
      document.querySelectorAll('[data-shorts-blocked="true"]').forEach((element) => {
        try {
          const clone = element.cloneNode(true);
          clone.removeAttribute("data-shorts-blocked");
          element.parentNode?.replaceChild(clone, element);
        } catch (err) {
          console.error("Error removing shorts blocks:", err);
        }
      });
      if (window.globalShortsBlockHandler) {
        document.removeEventListener("click", window.globalShortsBlockHandler, true);
        delete window.globalShortsBlockHandler;
      }
      return;
    }
    const blockClickHandler = (event) => {
      let element = event.target;
      let shortsLinkDetected = false;
      while (element && !shortsLinkDetected) {
        if (element.tagName === "A") {
          const href = element.getAttribute("href");
          if (href && href.includes("/shorts/")) {
            shortsLinkDetected = true;
            break;
          }
        }
        if (element.dataset && (element.dataset.contentType === "shorts" || element.classList.contains("shorts") || element.id.includes("shorts"))) {
          shortsLinkDetected = true;
          break;
        }
        element = element.parentElement;
      }
      if (shortsLinkDetected) {
        event.preventDefault();
        event.stopPropagation();
        console.log("YouTube Shorts Blocker: Prevented navigation to Shorts");
        const notification = document.createElement("div");
        notification.style.position = "fixed";
        notification.style.top = "60px";
        notification.style.left = "50%";
        notification.style.transform = "translateX(-50%)";
        notification.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        notification.style.color = "white";
        notification.style.padding = "10px 15px";
        notification.style.borderRadius = "4px";
        notification.style.zIndex = "9999";
        notification.style.fontWeight = "bold";
        notification.style.fontSize = "14px";
        notification.textContent = "Shorts Blocked by YouTube Shorts Blocker";
        document.body.appendChild(notification);
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 2e3);
        return false;
      }
    };
    if (!window.globalShortsBlockHandler) {
      window.globalShortsBlockHandler = blockClickHandler;
      document.addEventListener("click", blockClickHandler, true);
    }
    const addBlockers = () => {
      document.querySelectorAll(YOUTUBE_SELECTORS.SHORTS_THUMBNAILS).forEach((element) => {
        if (!element.dataset.shortsBlocked) {
          element.dataset.shortsBlocked = "true";
          try {
            const parent = element.closest("ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, ytd-compact-video-renderer");
            if (parent) {
              parent.style.position = "relative";
              const indicator = document.createElement("div");
              indicator.textContent = "SHORTS BLOCKED";
              indicator.style.position = "absolute";
              indicator.style.top = "0";
              indicator.style.left = "0";
              indicator.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
              indicator.style.color = "white";
              indicator.style.padding = "2px 5px";
              indicator.style.fontSize = "10px";
              indicator.style.zIndex = "100";
              indicator.style.pointerEvents = "none";
              parent.appendChild(indicator);
            }
          } catch (err) {
            console.warn("Could not add visual indicator:", err);
          }
        }
      });
    };
    addBlockers();
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldCheck = true;
        }
      });
      if (shouldCheck) {
        addBlockers();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.shortsBlockerObserver = observer;
  }
  function cleanupObservers() {
    if (window.shortsBlockerObserver) {
      window.shortsBlockerObserver.disconnect();
      delete window.shortsBlockerObserver;
    }
  }
  function applySettings(hideShorts, blockShorts) {
    if (hideShorts === true) {
      if (!document.getElementById("yt-shorts-blocker-style")) {
        injectCSS(HIDE_SHORTS_CSS);
      }
    } else {
      removeInjectedCSS();
    }
    blockShortsLinks(blockShorts === true);
  }
  function blockShortsURL() {
    console.log("YouTube Shorts Blocker: Checking if current URL is a Shorts URL...");
    const isShorts = window.location.pathname.includes("/shorts/") || document.querySelector(YOUTUBE_SELECTORS.SHORTS_PLAYER) !== null;
    if (isShorts) {
      console.log("YouTube Shorts Blocker: Detected Shorts page, redirecting to homepage");
      try {
        const shortsHidingStyle = document.createElement("style");
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
        setTimeout(() => {
          window.location.href = "https://www.youtube.com/";
        }, 50);
      } catch (err) {
        console.error("Error blocking shorts:", err);
        window.location.href = "https://www.youtube.com/";
      }
    }
  }
  function applyCustomFilters(filters) {
    const enabledFilters = filters.filter((f) => f.enabled);
    if (enabledFilters.length === 0) return;
    let customFilterCSS = "";
    enabledFilters.forEach((filter) => {
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
    if (customFilterCSS) {
      const style = document.createElement("style");
      style.id = "yt-shorts-custom-filters-style";
      style.textContent = customFilterCSS;
      document.head.appendChild(style);
    }
  }
  function applyCategoryFilters(categories) {
    if (!categories.length) return;
    let categoryFilterCSS = "";
    categories.forEach((category) => {
      const selector = YOUTUBE_SELECTORS.VIDEO_CATEGORY.replace("{category}", category);
      const chipSelector = YOUTUBE_SELECTORS.CATEGORY_CHIP.replace("{category}", category);
      categoryFilterCSS += `
      /* Category filter: ${category} */
      ${selector},
      ${chipSelector} {
        display: none !important;
      }
    `;
    });
    if (categoryFilterCSS) {
      const style = document.createElement("style");
      style.id = "yt-category-filters-style";
      style.textContent = categoryFilterCSS;
      document.head.appendChild(style);
    }
  }
  function initBlocker() {
    if (document.location.hostname.includes("youtube.com")) {
      try {
        const defaultSettings = {
          hideShorts: true,
          // Default
          blockShorts: false,
          // Default
          customFilters: [],
          categoryFilters: [],
          useStatistics: true,
          whitelist: []
        };
        try {
          chrome.storage.sync.get(
            defaultSettings,
            (settings) => {
              try {
                const currentUrl = window.location.href;
                const shortsId = getShortsIdFromUrl(currentUrl);
                if (shortsId && settings.whitelist?.includes(shortsId)) {
                  console.log(`Shorts ${shortsId} is whitelisted, not blocking.`);
                  return;
                }
                applySettings(settings.hideShorts, settings.blockShorts);
                if (settings.customFilters && settings.customFilters.length > 0) {
                  applyCustomFilters(settings.customFilters);
                }
                if (settings.categoryFilters && settings.categoryFilters.length > 0) {
                  applyCategoryFilters(settings.categoryFilters);
                }
                if (settings.blockShorts === true && shortsId) {
                  const isShorts = window.location.pathname.includes("/shorts/");
                  if (isShorts) {
                    trackShortsStatistic("blocked", shortsId);
                  }
                }
                if (settings.blockShorts === true) {
                  blockShortsURL();
                }
              } catch (err) {
                console.error("Error in settings callback:", err);
                applySettings(true, false);
              }
            }
          );
        } catch (err) {
          console.error("Error accessing Chrome storage:", err);
          applySettings(true, false);
        }
      } catch (err) {
        console.error("Critical error in initBlocker:", err);
        try {
          applySettings(true, false);
        } catch (finalErr) {
          console.error("Could not apply default settings:", finalErr);
        }
      }
    }
  }
  function getShortsIdFromUrl(url) {
    const match = url.match(/\/shorts\/([^/?&]+)/);
    return match ? match[1] : null;
  }
  function trackShortsStatistic(type, shortsId) {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          action: "trackStatistic",
          statsType: type,
          shortsId
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log("Error in trackShortsStatistic:", chrome.runtime.lastError.message);
          }
        });
      } catch (error) {
        console.error("Error tracking statistic:", error);
      }
    }
  }
  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        if (message.action === "settingsUpdated") {
          applySettings(message.hideShorts, message.blockShorts);
          if (message.blockShorts === true) {
            blockShortsURL();
          }
          if (message.customFilters && message.customFilters.length > 0) {
            applyCustomFilters(message.customFilters);
          }
          if (message.categoryFilters && message.categoryFilters.length > 0) {
            applyCategoryFilters(message.categoryFilters);
          }
          if (sendResponse) {
            sendResponse({ success: true });
          }
        }
      } catch (err) {
        const error = err;
        console.error("Error handling message:", error);
        if (sendResponse) {
          sendResponse({ success: false, error: error.message || "Unknown error occurred" });
        }
      }
      return true;
    });
  } catch (error) {
    console.error("Error setting up message listener:", error);
  }
  document.addEventListener("DOMContentLoaded", initBlocker);
  initBlocker();
  window.addEventListener("yt-navigate-finish", () => {
    console.log("YouTube navigation detected, reapplying settings");
    initBlocker();
  });
  var lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log("URL changed to", url);
      initBlocker();
    }
  }).observe(document, { subtree: true, childList: true });
  window.addEventListener("unload", () => {
    cleanupObservers();
    removeInjectedCSS();
  });
})();
