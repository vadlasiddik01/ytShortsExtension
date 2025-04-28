import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
  const [isHideShortsEnabled, setIsHideShortsEnabled] = useState<boolean>(true);
  const [isBlockShortsEnabled, setIsBlockShortsEnabled] = useState<boolean>(false);
  const [useStatistics, setUseStatistics] = useState<boolean>(true);
  const [customFilters, setCustomFilters] = useState<FilterRule[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    shortsBlocked: 0,
    shortsHidden: 0,
    lastReset: Date.now()
  });
  
  // Computed property - extension is active if either toggle is enabled
  const isExtensionActive = isHideShortsEnabled || isBlockShortsEnabled;

  // Load settings from Chrome storage when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      // Check if Chrome extension API is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        try {
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
        } catch (error) {
          console.error('Error loading settings:', error);
          // Use default values in case of error
        }
      } else {
        console.log('Chrome API not available, using default settings');
        // We're not in a Chrome extension context, use default values
      }
    };

    loadSettings();
  }, []);

  // Toggle handlers - update state and save to Chrome storage
  const toggleHideShorts = () => {
    const newValue = !isHideShortsEnabled;
    setIsHideShortsEnabled(newValue);
    
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

  const toggleBlockShorts = () => {
    const newValue = !isBlockShortsEnabled;
    setIsBlockShortsEnabled(newValue);
    
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
  const toggleStatistics = () => {
    const newValue = !useStatistics;
    setUseStatistics(newValue);
    
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
  const resetStatistics = () => {
    const newStats = {
      shortsBlocked: 0,
      shortsHidden: 0,
      lastReset: Date.now()
    };
    
    setStatistics(newStats);
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({ action: 'resetStatistics' });
      } catch (error) {
        console.error('Error resetting statistics:', error);
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
