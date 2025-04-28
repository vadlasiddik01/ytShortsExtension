// Type definitions for Chrome extension API
// This is a simplified version of the Chrome API types

// Generic callback type
type Callback<T = any> = (arg: T) => void;

interface Chrome {
  runtime: {
    id?: string;
    lastError?: {
      message: string;
    };
    getURL(path: string): string;
    getManifest(): any;
    openOptionsPage(callback?: () => void): void;
    sendMessage(message: any, responseCallback?: (response: any) => void): void;
    onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: (response?: any) => void) => boolean | void): void;
      removeListener(callback: (message: any, sender: any, sendResponse: (response?: any) => void) => boolean | void): void;
    };
    onInstalled: {
      addListener(callback: (details: { reason: string; previousVersion?: string; id?: string }) => void): void;
    };
  };
  storage: {
    sync: {
      get<T = any>(keys: string | string[] | { [key: string]: any } | null, callback: (items: T) => void): void;
      set(items: { [key: string]: any }, callback?: () => void): void;
      remove(keys: string | string[], callback?: () => void): void;
      clear(callback?: () => void): void;
    };
    local: {
      get<T = any>(keys: string | string[] | { [key: string]: any } | null, callback: (items: T) => void): void;
      set(items: { [key: string]: any }, callback?: () => void): void;
      remove(keys: string | string[], callback?: () => void): void;
      clear(callback?: () => void): void;
    };
    onChanged: {
      addListener(callback: (changes: { [key: string]: { oldValue?: any; newValue?: any } }, areaName: string) => void): void;
      removeListener(callback: (changes: { [key: string]: { oldValue?: any; newValue?: any } }, areaName: string) => void): void;
    };
  };
  tabs: {
    query(queryInfo: {
      active?: boolean;
      currentWindow?: boolean;
      lastFocusedWindow?: boolean;
      status?: string;
      title?: string;
      url?: string;
      windowId?: number;
      windowType?: string;
      index?: number;
      highlighted?: boolean;
      audible?: boolean;
      muted?: boolean;
      pinned?: boolean;
      discarded?: boolean;
      autoDiscardable?: boolean;
      currentWindow?: boolean;
      lastFocusedWindow?: boolean;
    }, callback: (result: any[]) => void): void;
    sendMessage(tabId: number, message: any, responseCallback?: (response: any) => void): void;
    reload(tabId: number, reloadProperties?: { bypassCache?: boolean }, callback?: () => void): void;
    onUpdated: {
      addListener(callback: (tabId: number, changeInfo: { status?: string; url?: string; title?: string }, tab: { id?: number; url?: string }) => void): void;
      removeListener(callback: (tabId: number, changeInfo: { status?: string; url?: string; title?: string }, tab: { id?: number; url?: string }) => void): void;
    };
  };
  action: {
    setBadgeText(details: { text: string; tabId?: number }): void;
    setBadgeBackgroundColor(details: { color: string; tabId?: number }): void;
    setTitle(details: { title: string; tabId?: number }): void;
    openPopup(): void;
  };
  scripting: {
    executeScript(injection: {
      target: { tabId: number; frameIds?: number[] };
      files?: string[];
      func?: Function;
      args?: any[];
      injectImmediately?: boolean;
      world?: string;
    }): Promise<any[]>;
  };
}

declare var chrome: Chrome;