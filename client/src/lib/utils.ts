import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if the chrome extension API is available
 */
export function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id !== undefined;
}

/**
 * Checks if we're running in a development environment
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Gets the extension version from manifest
 */
export async function getExtensionVersion(): Promise<string> {
  if (!isChromeExtension()) {
    return '1.0.0'; // Default for non-extension environments
  }
  
  const manifest = chrome.runtime.getManifest();
  return manifest.version;
}

/**
 * Safely sends a message to the content script
 */
export function sendMessageToContentScript(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!isChromeExtension()) {
      reject(new Error('Not running as a Chrome extension'));
      return;
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) {
        reject(new Error('No active tab found'));
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  });
}
