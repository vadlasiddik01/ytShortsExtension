"use strict";
(() => {
  // client/src/content-scripts/youtube-blocker.ts
  var YOUTUBE_SELECTORS = {
    // Sidebar Shorts icon and label
    SIDEBAR_SHORTS: 'ytd-guide-entry-renderer:has(a[title="Shorts"])',
    // Shorts section in the home feed
    FEED_SHORTS_SHELF: 'ytd-rich-section-renderer:has(#title:has-text("Shorts"))',
    FEED_SHORTS_MINI_SHELF: "ytd-reel-shelf-renderer",
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
    CATEGORY_CHIP: '#text.ytd-channel-name:contains("{category}")'
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
    if (enabled !== true) {
      document.querySelectorAll('[data-shorts-blocked="true"]').forEach((element) => {
        const clone = element.cloneNode(true);
        clone.removeAttribute("data-shorts-blocked");
        element.parentNode?.replaceChild(clone, element);
      });
      return;
    }
    const blockClickHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log("YouTube Shorts Blocker: Prevented navigation to Shorts");
      return false;
    };
    const addBlockers = () => {
      document.querySelectorAll(YOUTUBE_SELECTORS.SHORTS_THUMBNAILS).forEach((element) => {
        if (!element.dataset.shortsBlocked) {
          element.addEventListener("click", blockClickHandler, true);
          element.dataset.shortsBlocked = "true";
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
    if (window.location.pathname.includes("/shorts/")) {
      window.location.href = "https://www.youtube.com/";
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
      chrome.storage.sync.get(
        {
          hideShorts: true,
          // Default
          blockShorts: false,
          // Default
          customFilters: [],
          categoryFilters: [],
          useStatistics: true,
          whitelist: []
        },
        (settings) => {
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
        }
      );
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
        });
      } catch (error) {
        console.error("Error tracking statistic:", error);
      }
    }
  }
  chrome.runtime.onMessage.addListener((message) => {
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
    }
    return true;
  });
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
