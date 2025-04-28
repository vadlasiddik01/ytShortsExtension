import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { registerInstallation, saveSettings, getSettings, updateStatistics, getStatistics, resetStatistics as resetApiStatistics } from '../lib/apiClient';

// Define filter rule type
interface FilterRule {
  id: string;
  pattern: string;
  enabled: boolean;
}

// Define statistics type
interface Statistics {
  shortsBlocked: number;
  shortsHidden: number;
  lastReset: number;
}

// Define context types
interface BlockerContextType {
  isHideShortsEnabled: boolean;
  isBlockShortsEnabled: boolean;
  useStatistics: boolean;
  isExtensionActive: boolean;
  customFilters: FilterRule[];
  categoryFilters: string[];
  whitelist: string[];
  statistics: Statistics;
  
  // Actions
  toggleHideShorts: () => void;
  toggleBlockShorts: () => void;
  toggleStatistics: () => void;
  addCustomFilter: (pattern: string) => void;
  updateCustomFilter: (id: string, pattern: string, enabled: boolean) => void;
  removeCustomFilter: (id: string) => void;
  addCategoryFilter: (category: string) => void;
  removeCategoryFilter: (category: string) => void;
  addToWhitelist: (shortsId: string) => void;
  removeFromWhitelist: (shortsId: string) => void;
  resetStatistics: () => void;
}

// Create context with default values
const BlockerContext = createContext<BlockerContextType>({
  isHideShortsEnabled: true, // Default value
  isBlockShortsEnabled: false, // Default value
  useStatistics: true, // Default value
  isExtensionActive: true, // Default value
  customFilters: [], // Default value
  categoryFilters: [], // Default value
  whitelist: [], // Default value
  statistics: { shortsBlocked: 0, shortsHidden: 0, lastReset: Date.now() }, // Default value
  
  // Default empty functions
  toggleHideShorts: () => {},
  toggleBlockShorts: () => {},
  toggleStatistics: () => {},
  addCustomFilter: () => {},
  updateCustomFilter: () => {},
  removeCustomFilter: () => {},
  addCategoryFilter: () => {},
  removeCategoryFilter: () => {},
  addToWhitelist: () => {},
  removeFromWhitelist: () => {},
  resetStatistics: () => {},
});

// Provider component to wrap the application
export const BlockerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // State for core settings
  const [isHideShortsEnabled, setIsHideShortsEnabled] = useState<boolean>(true);
  const [isBlockShortsEnabled, setIsBlockShortsEnabled] = useState<boolean>(false);
  const [useStatistics, setUseStatistics] = useState<boolean>(true);
  
  // State for filters and whitelist
  const [customFilters, setCustomFilters] = useState<FilterRule[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  
  // State for statistics
  const [statistics, setStatistics] = useState<Statistics>({
    shortsBlocked: 0,
    shortsHidden: 0,
    lastReset: Date.now()
  });
  
  // Installation ID - unique identifier for this extension installation
  const [installationId, setInstallationId] = useState<string>("");
  
  // Computed property - extension is active if either toggle is enabled
  const isExtensionActive = isHideShortsEnabled || isBlockShortsEnabled;

  // Initialize installation ID and load settings
  useEffect(() => {
    const initializeExtension = async () => {
      let currentInstallationId = '';
      const browserInfo = navigator.userAgent;
      const extensionVersion = "1.0.0"; // Should get from manifest in production
      
      // Check if Chrome extension API is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        try {
          // Try to get installation ID from Chrome storage
          chrome.storage.sync.get({ installationId: '' }, async (result) => {
            if (result.installationId) {
              // Use existing installation ID
              currentInstallationId = result.installationId;
            } else {
              // Generate new installation ID
              currentInstallationId = uuidv4();
              // Save to Chrome storage
              chrome.storage.sync.set({ installationId: currentInstallationId });
            }
            
            // Register with API
            const registration = await registerInstallation(
              currentInstallationId, 
              extensionVersion,
              browserInfo
            );
            
            setInstallationId(registration.installationId);
            
            // Now load settings
            loadSettingsFromStorage();
            
            // Load server settings if available
            try {
              const serverSettings = await getSettings(registration.installationId);
              if (serverSettings) {
                setIsHideShortsEnabled(serverSettings.hideShorts ?? true);
                setIsBlockShortsEnabled(serverSettings.blockShorts ?? false);
                setUseStatistics(serverSettings.useStatistics ?? true);
                
                // Update Chrome storage with server settings
                if (chrome.storage && chrome.storage.sync) {
                  chrome.storage.sync.set({
                    hideShorts: serverSettings.hideShorts,
                    blockShorts: serverSettings.blockShorts,
                    useStatistics: serverSettings.useStatistics,
                  });
                }
              }
              
              // Load server statistics if available
              if (useStatistics) {
                const serverStats = await getStatistics(registration.installationId);
                if (serverStats) {
                  const convertedStats = {
                    shortsBlocked: serverStats.shortsBlocked || 0,
                    shortsHidden: serverStats.shortsHidden || 0,
                    lastReset: new Date(serverStats.lastReset).getTime() || Date.now()
                  };
                  
                  setStatistics(convertedStats);
                  
                  // Update Chrome storage with server statistics
                  if (chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set({ statistics: convertedStats });
                  }
                }
              }
            } catch (error) {
              console.error('Error loading server settings:', error);
            }
          });
        } catch (error) {
          console.error('Error with Chrome storage:', error);
          handleNonChromeInit();
        }
      } else {
        console.log('Chrome API not available, using default settings');
        handleNonChromeInit();
      }
    };
    
    // For non-Chrome environments or when Chrome API fails
    const handleNonChromeInit = async () => {
      // Generate an installation ID for testing
      const testId = uuidv4();
      setInstallationId(testId);
      
      // Register with API for testing
      await registerInstallation(testId, "1.0.0-dev", navigator.userAgent);
      
      // Use default settings
      loadDefaultSettings();
    };
    
    // Load settings from Chrome storage
    const loadSettingsFromStorage = () => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        // Get saved settings from Chrome's storage
        chrome.storage.sync.get(
          {
            hideShorts: true, // Default value
            blockShorts: false, // Default value
            useStatistics: true, // Default value
            customFilters: [
              { id: 'default-1', pattern: 'Shorts shelf', enabled: true },
              { id: 'default-2', pattern: 'Shorts feed', enabled: true }
            ], // Default value
            categoryFilters: [], // Default value
            whitelist: [] // Default value
          },
          (items) => {
            if (items) {
              setIsHideShortsEnabled(items.hideShorts === true);
              setIsBlockShortsEnabled(items.blockShorts === true);
              setUseStatistics(items.useStatistics === true);
              setCustomFilters(items.customFilters || []);
              setCategoryFilters(items.categoryFilters || []);
              setWhitelist(items.whitelist || []);
            }
          }
        );
        
        // Load statistics from local storage
        chrome.storage.local.get(
          {
            statistics: {
              shortsBlocked: 0,
              shortsHidden: 0,
              lastReset: Date.now()
            }
          },
          (items) => {
            if (items && items.statistics) {
              setStatistics(items.statistics);
            }
          }
        );
      }
    };
    
    // Load default settings for non-Chrome environments
    const loadDefaultSettings = () => {
      setIsHideShortsEnabled(true);
      setIsBlockShortsEnabled(false);
      setUseStatistics(true);
      setCustomFilters([
        { id: 'default-1', pattern: 'Shorts shelf', enabled: true },
        { id: 'default-2', pattern: 'Shorts feed', enabled: true }
      ]);
      setCategoryFilters([]);
      setWhitelist([]);
      setStatistics({
        shortsBlocked: 0,
        shortsHidden: 0,
        lastReset: Date.now()
      });
    };

    initializeExtension();
  }, []);

  // Toggle handlers - update state and save to storage (both Chrome and database)
  const toggleHideShorts = async () => {
    const newValue = !isHideShortsEnabled;
    setIsHideShortsEnabled(newValue);
    
    // Save to database if we have an installation ID
    if (installationId) {
      try {
        await saveSettings(installationId, {
          hideShorts: newValue,
          blockShorts: isBlockShortsEnabled,
          useStatistics
        });
      } catch (error) {
        console.error('Error saving settings to server:', error);
      }
    }
    
    // Safe check for Chrome extension API
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        // Save to Chrome storage
        chrome.storage.sync.set({ hideShorts: newValue });
        
        // Send message to content script to update
        if (chrome.tabs) {
          chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
            tabs.forEach(tab => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { 
                  action: 'settingsUpdated', 
                  hideShorts: newValue,
                  blockShorts: isBlockShortsEnabled
                });
              }
            });
          });
        }
      } catch (error) {
        console.error('Error saving settings or sending message:', error);
      }
    } else {
      console.log('Chrome API not available, settings saved locally only');
    }
  };

  const toggleBlockShorts = async () => {
    const newValue = !isBlockShortsEnabled;
    setIsBlockShortsEnabled(newValue);
    
    // Save to database if we have an installation ID
    if (installationId) {
      try {
        await saveSettings(installationId, {
          hideShorts: isHideShortsEnabled,
          blockShorts: newValue,
          useStatistics
        });
      } catch (error) {
        console.error('Error saving settings to server:', error);
      }
    }
    
    // Safe check for Chrome extension API
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        // Save to Chrome storage
        chrome.storage.sync.set({ blockShorts: newValue });
        
        // Send message to content script to update
        if (chrome.tabs) {
          chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
            tabs.forEach(tab => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { 
                  action: 'settingsUpdated', 
                  hideShorts: isHideShortsEnabled,
                  blockShorts: newValue
                });
              }
            });
          });
        }
      } catch (error) {
        console.error('Error saving settings or sending message:', error);
      }
    } else {
      console.log('Chrome API not available, settings saved locally only');
    }
  };

  // Toggle statistics tracking
  const toggleStatistics = async () => {
    const newValue = !useStatistics;
    setUseStatistics(newValue);
    
    // Save to database if we have an installation ID
    if (installationId) {
      try {
        await saveSettings(installationId, {
          hideShorts: isHideShortsEnabled,
          blockShorts: isBlockShortsEnabled,
          useStatistics: newValue
        });
      } catch (error) {
        console.error('Error saving settings to server:', error);
      }
    }
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        chrome.storage.sync.set({ useStatistics: newValue });
      } catch (error) {
        console.error('Error saving statistics setting:', error);
      }
    }
  };
  
  // Add a custom filter
  const addCustomFilter = (pattern: string) => {
    const newFilter: FilterRule = {
      id: uuidv4(),
      pattern,
      enabled: true
    };
    
    const updatedFilters = [...customFilters, newFilter];
    setCustomFilters(updatedFilters);
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        chrome.storage.sync.set({ customFilters: updatedFilters });
        updateContentScripts({ customFilters: updatedFilters });
      } catch (error) {
        console.error('Error saving custom filter:', error);
      }
    }
  };
  
  // Update an existing custom filter
  const updateCustomFilter = (id: string, pattern: string, enabled: boolean) => {
    const updatedFilters = customFilters.map(filter => 
      filter.id === id ? { ...filter, pattern, enabled } : filter
    );
    
    setCustomFilters(updatedFilters);
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        chrome.storage.sync.set({ customFilters: updatedFilters });
        updateContentScripts({ customFilters: updatedFilters });
      } catch (error) {
        console.error('Error updating custom filter:', error);
      }
    }
  };
  
  // Remove a custom filter
  const removeCustomFilter = (id: string) => {
    const updatedFilters = customFilters.filter(filter => filter.id !== id);
    
    setCustomFilters(updatedFilters);
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        chrome.storage.sync.set({ customFilters: updatedFilters });
        updateContentScripts({ customFilters: updatedFilters });
      } catch (error) {
        console.error('Error removing custom filter:', error);
      }
    }
  };
  
  // Add a category filter
  const addCategoryFilter = (category: string) => {
    if (categoryFilters.includes(category)) return;
    
    const updatedFilters = [...categoryFilters, category];
    setCategoryFilters(updatedFilters);
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        chrome.storage.sync.set({ categoryFilters: updatedFilters });
        updateContentScripts({ categoryFilters: updatedFilters });
      } catch (error) {
        console.error('Error saving category filter:', error);
      }
    }
  };
  
  // Remove a category filter
  const removeCategoryFilter = (category: string) => {
    const updatedFilters = categoryFilters.filter(cat => cat !== category);
    
    setCategoryFilters(updatedFilters);
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        chrome.storage.sync.set({ categoryFilters: updatedFilters });
        updateContentScripts({ categoryFilters: updatedFilters });
      } catch (error) {
        console.error('Error removing category filter:', error);
      }
    }
  };
  
  // Add a shorts ID to whitelist
  const addToWhitelist = (shortsId: string) => {
    if (whitelist.includes(shortsId)) return;
    
    const updatedWhitelist = [...whitelist, shortsId];
    setWhitelist(updatedWhitelist);
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        chrome.storage.sync.set({ whitelist: updatedWhitelist });
        chrome.runtime.sendMessage({ 
          action: 'addToWhitelist', 
          shortsId 
        });
      } catch (error) {
        console.error('Error adding to whitelist:', error);
      }
    }
  };
  
  // Remove a shorts ID from whitelist
  const removeFromWhitelist = (shortsId: string) => {
    const updatedWhitelist = whitelist.filter(id => id !== shortsId);
    
    setWhitelist(updatedWhitelist);
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        chrome.storage.sync.set({ whitelist: updatedWhitelist });
        chrome.runtime.sendMessage({ 
          action: 'removeFromWhitelist', 
          shortsId 
        });
      } catch (error) {
        console.error('Error removing from whitelist:', error);
      }
    }
  };
  
  // Reset statistics
  const resetStatistics = async () => {
    const newStats = {
      shortsBlocked: 0,
      shortsHidden: 0,
      lastReset: Date.now()
    };
    
    setStatistics(newStats);
    
    // Reset statistics on the server
    if (installationId && useStatistics) {
      try {
        await resetApiStatistics(installationId);
      } catch (error) {
        console.error('Error resetting statistics on server:', error);
      }
    }
    
    // Also reset via Chrome API for background.js
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({ action: 'resetStatistics' });
      } catch (error) {
        console.error('Error resetting statistics via message:', error);
      }
    }
    
    // Save to local storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.set({ statistics: newStats });
      } catch (error) {
        console.error('Error saving reset statistics to storage:', error);
      }
    }
  };
  
  // Helper function to update content scripts with new settings
  const updateContentScripts = (settings: any) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'settingsUpdated',
              hideShorts: isHideShortsEnabled,
              blockShorts: isBlockShortsEnabled,
              ...settings
            });
          }
        });
      });
    }
  };
  
  // Context value
  const value = {
    isHideShortsEnabled,
    isBlockShortsEnabled,
    useStatistics,
    isExtensionActive,
    customFilters,
    categoryFilters,
    whitelist,
    statistics,
    
    toggleHideShorts,
    toggleBlockShorts,
    toggleStatistics,
    addCustomFilter,
    updateCustomFilter,
    removeCustomFilter,
    addCategoryFilter,
    removeCategoryFilter,
    addToWhitelist,
    removeFromWhitelist,
    resetStatistics
  };

  return (
    <BlockerContext.Provider value={value}>
      {children}
    </BlockerContext.Provider>
  );
};

// Custom hook for using the context
export const useBlockerContext = () => useContext(BlockerContext);
