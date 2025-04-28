import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define context types
interface BlockerContextType {
  isHideShortsEnabled: boolean;
  isBlockShortsEnabled: boolean;
  isExtensionActive: boolean;
  toggleHideShorts: () => void;
  toggleBlockShorts: () => void;
}

// Create context with default values
const BlockerContext = createContext<BlockerContextType>({
  isHideShortsEnabled: true, // Default value
  isBlockShortsEnabled: false, // Default value
  isExtensionActive: true, // Default value
  toggleHideShorts: () => {},
  toggleBlockShorts: () => {},
});

// Provider component to wrap the application
export const BlockerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isHideShortsEnabled, setIsHideShortsEnabled] = useState<boolean>(true);
  const [isBlockShortsEnabled, setIsBlockShortsEnabled] = useState<boolean>(false);
  
  // Computed property - extension is active if either toggle is enabled
  const isExtensionActive = isHideShortsEnabled || isBlockShortsEnabled;

  // Load settings from Chrome storage when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      if (chrome && chrome.storage) {
        // Get saved settings from Chrome's storage
        chrome.storage.sync.get(
          {
            hideShorts: true, // Default value
            blockShorts: false // Default value
          },
          (items) => {
            setIsHideShortsEnabled(items.hideShorts);
            setIsBlockShortsEnabled(items.blockShorts);
          }
        );
      }
    };

    loadSettings();
  }, []);

  // Toggle handlers - update state and save to Chrome storage
  const toggleHideShorts = () => {
    const newValue = !isHideShortsEnabled;
    setIsHideShortsEnabled(newValue);
    
    if (chrome && chrome.storage) {
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
    }
  };

  const toggleBlockShorts = () => {
    const newValue = !isBlockShortsEnabled;
    setIsBlockShortsEnabled(newValue);
    
    if (chrome && chrome.storage) {
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
    }
  };

  // Context value
  const value = {
    isHideShortsEnabled,
    isBlockShortsEnabled,
    isExtensionActive,
    toggleHideShorts,
    toggleBlockShorts,
  };

  return (
    <BlockerContext.Provider value={value}>
      {children}
    </BlockerContext.Provider>
  );
};

// Custom hook for using the context
export const useBlockerContext = () => useContext(BlockerContext);
