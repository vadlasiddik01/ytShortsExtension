"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };

  // client/public/hot-reload.js
  var hot_reload_exports = {};
  var filesInDirectory, timestampForFilesInDirectory, reload, watchChanges;
  var init_hot_reload = __esm({
    "client/public/hot-reload.js"() {
      "use strict";
      filesInDirectory = (dir) => new Promise(
        (resolve) => dir.createReader().readEntries((entries) => {
          Promise.all(entries.filter((e) => e.name[0] !== ".").map(
            (e) => e.isDirectory ? filesInDirectory(e) : new Promise((resolve2) => e.file(resolve2))
          )).then((files) => [].concat(...files)).then(resolve);
        })
      );
      timestampForFilesInDirectory = (dir) => filesInDirectory(dir).then((files) => files.map((f) => f.name + f.lastModifiedDate).join());
      reload = () => {
        chrome.runtime.reload();
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.reload(tabs[0].id);
          }
          chrome.action?.getBadgeText({}, () => {
            if (!chrome.runtime.lastError) {
              chrome.runtime.sendMessage({ action: "hotReload" });
            }
          });
        });
      };
      watchChanges = (dir, lastTimestamp) => {
        timestampForFilesInDirectory(dir).then((timestamp) => {
          if (!lastTimestamp || lastTimestamp === timestamp) {
            setTimeout(() => watchChanges(dir, timestamp), 1e3);
          } else {
            reload();
          }
        });
      };
      chrome.management.getSelf((self) => {
        if (self.installType === "development") {
          chrome.runtime.getPackageDirectoryEntry((dir) => watchChanges(dir));
          console.log("\u{1F4A7} Hot reload activated!");
        }
      });
    }
  });

  // client/src/lib/utils.ts
  function isChromeExtension() {
    return typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id !== void 0;
  }

  // client/src/lib/apiClient.ts
  var API_BASE_URL = true ? "https://youtubeshortsblockr.replit.app/api" : "/api";
  async function saveSettings(installationId, settings) {
    try {
      if (!isChromeExtension() && true) {
        return settings;
      }
      const response = await fetch(`${API_BASE_URL}/extension/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          installationId,
          ...settings
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error saving settings:", error);
      return settings;
    }
  }
  async function updateStatistics(installationId, blockedDelta = 0, hiddenDelta = 0) {
    try {
      if (!isChromeExtension() && true) {
        return null;
      }
      const response = await fetch(`${API_BASE_URL}/extension/statistics/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          installationId,
          blockedDelta,
          hiddenDelta
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to update statistics: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating statistics:", error);
      return null;
    }
  }
  async function resetStatistics(installationId) {
    try {
      if (!isChromeExtension() && true) {
        return null;
      }
      const response = await fetch(`${API_BASE_URL}/extension/statistics/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          installationId
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to reset statistics: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error resetting statistics:", error);
      return null;
    }
  }

  // client/src/background.ts
  try {
    if (chrome.management) {
      chrome.management.getSelf((self) => {
        if (self.installType === "development") {
          Promise.resolve().then(() => (init_hot_reload(), hot_reload_exports)).then(() => console.log("Hot reload activated!")).catch((err) => console.error("Hot reload failed:", err));
        }
      });
    }
  } catch (error) {
    console.log("Hot reload not available in this environment");
  }
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
      hideShorts: true,
      blockShorts: false,
      customFilters: [
        { id: "default-1", pattern: "Shorts shelf", enabled: true },
        { id: "default-2", pattern: "Shorts feed", enabled: true }
      ],
      categoryFilters: [],
      useStatistics: true,
      whitelist: []
    }, () => {
      console.log("YouTube Shorts Blocker initialized with default settings");
    });
    chrome.storage.local.set({
      statistics: {
        shortsBlocked: 0,
        shortsHidden: 0,
        lastReset: Date.now()
      }
    });
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getSettings") {
      chrome.storage.sync.get(
        {
          hideShorts: true,
          blockShorts: false,
          customFilters: [],
          categoryFilters: [],
          useStatistics: true,
          whitelist: []
        },
        (settings) => {
          sendResponse(settings);
        }
      );
      return true;
    }
    if (message.action === "trackStatistic" && message.statsType && message.shortsId) {
      chrome.storage.sync.get({ useStatistics: true, installationId: "" }, (settings) => {
        if (settings.useStatistics) {
          chrome.storage.local.get(
            { statistics: { shortsBlocked: 0, shortsHidden: 0, lastReset: Date.now() } },
            async (data) => {
              const statistics = data.statistics;
              let blockedDelta = 0;
              let hiddenDelta = 0;
              if (message.statsType === "blocked") {
                statistics.shortsBlocked++;
                blockedDelta = 1;
              } else if (message.statsType === "hidden") {
                statistics.shortsHidden++;
                hiddenDelta = 1;
              }
              chrome.storage.local.set({ statistics });
              if (settings.installationId) {
                try {
                  await updateStatistics(settings.installationId, blockedDelta, hiddenDelta);
                } catch (error) {
                  console.error("Error updating statistics in database:", error);
                }
              }
            }
          );
        }
      });
      return true;
    }
    if (message.action === "checkWhitelist" && message.shortsId) {
      chrome.storage.sync.get({ whitelist: [] }, (settings) => {
        const isWhitelisted = settings.whitelist.includes(message.shortsId);
        sendResponse({ isWhitelisted });
      });
      return true;
    }
    if (message.action === "addToWhitelist" && message.shortsId) {
      chrome.storage.sync.get({ whitelist: [], installationId: "" }, async (settings) => {
        if (!settings.whitelist.includes(message.shortsId)) {
          const whitelist = [...settings.whitelist, message.shortsId];
          chrome.storage.sync.set({ whitelist });
          if (settings.installationId) {
            try {
              await saveSettings(settings.installationId, { whitelist });
            } catch (error) {
              console.error("Error saving whitelist to database:", error);
            }
          }
        }
        sendResponse({ success: true });
      });
      return true;
    }
    if (message.action === "removeFromWhitelist" && message.shortsId) {
      chrome.storage.sync.get({ whitelist: [], installationId: "" }, async (settings) => {
        const whitelist = settings.whitelist.filter((id) => id !== message.shortsId);
        chrome.storage.sync.set({ whitelist });
        if (settings.installationId) {
          try {
            await saveSettings(settings.installationId, { whitelist });
          } catch (error) {
            console.error("Error saving whitelist to database:", error);
          }
        }
        sendResponse({ success: true });
      });
      return true;
    }
    if (message.action === "getStatistics") {
      chrome.storage.local.get(
        { statistics: { shortsBlocked: 0, shortsHidden: 0, lastReset: Date.now() } },
        (data) => {
          sendResponse(data.statistics);
        }
      );
      return true;
    }
    if (message.action === "resetStatistics") {
      chrome.storage.sync.get({ installationId: "" }, async (settings) => {
        const newStats = {
          shortsBlocked: 0,
          shortsHidden: 0,
          lastReset: Date.now()
        };
        chrome.storage.local.set({ statistics: newStats });
        if (settings.installationId) {
          try {
            await resetStatistics(settings.installationId);
          } catch (error) {
            console.error("Error resetting statistics in database:", error);
          }
        }
        sendResponse({ success: true });
      });
      return true;
    }
  });
  function updateBadgeStatus() {
    chrome.storage.sync.get(
      {
        hideShorts: true,
        blockShorts: false
      },
      (settings) => {
        const isActive = settings.hideShorts || settings.blockShorts;
        if (isActive) {
          chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
          chrome.action.setBadgeText({ text: "ON" });
        } else {
          chrome.action.setBadgeBackgroundColor({ color: "#AAAAAA" });
          chrome.action.setBadgeText({ text: "OFF" });
        }
      }
    );
  }
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.hideShorts || changes.blockShorts) {
      updateBadgeStatus();
    }
  });
  updateBadgeStatus();
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && tab.url.includes("youtube.com")) {
      chrome.storage.sync.get(
        {
          hideShorts: true,
          blockShorts: false
        },
        (settings) => {
          if (settings.hideShorts || settings.blockShorts) {
            chrome.tabs.sendMessage(tabId, {
              action: "settingsUpdated",
              hideShorts: settings.hideShorts,
              blockShorts: settings.blockShorts
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.log("Content script not ready, injecting it");
                chrome.scripting.executeScript({
                  target: { tabId },
                  files: ["content-scripts/youtube-blocker.js"]
                }).catch((error) => {
                  console.error("Error injecting content script:", error);
                });
              }
            });
          }
        }
      );
    }
  });
})();
