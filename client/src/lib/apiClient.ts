import { isChromeExtension } from "./utils";

// Base URL for API calls
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://youtubeshortsblockr.replit.app/api'
  : '/api'; // Use relative path to avoid CORS issues in development

/**
 * Register the extension installation
 */
export async function registerInstallation(installationId: string, version: string, browserInfo?: string): Promise<{ installationId: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/extension/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        installationId,
        version,
        browserInfo,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register installation: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering installation:', error);
    // Return the original ID even if registration fails
    return { installationId };
  }
}

/**
 * Save settings to the server
 */
export async function saveSettings(installationId: string, settings: {
  hideShorts?: boolean;
  blockShorts?: boolean;
  useStatistics?: boolean;
  customFilters?: any[];
  categoryFilters?: string[];
  whitelist?: string[];
}): Promise<any> {
  try {
    // Only call the API if we're in development mode or running as a Chrome extension
    if (!isChromeExtension() && process.env.NODE_ENV !== 'development') {
      return settings;
    }

    const response = await fetch(`${API_BASE_URL}/extension/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        installationId,
        ...settings,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving settings:', error);
    return settings;
  }
}

/**
 * Get settings from the server
 */
export async function getSettings(installationId: string): Promise<any> {
  try {
    // Only call the API if we're in development mode or running as a Chrome extension
    if (!isChromeExtension() && process.env.NODE_ENV !== 'development') {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/extension/settings/${installationId}`);

    if (!response.ok) {
      throw new Error(`Failed to get settings: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting settings:', error);
    return null;
  }
}

/**
 * Update statistics on the server
 */
export async function updateStatistics(
  installationId: string,
  blockedDelta: number = 0,
  hiddenDelta: number = 0
): Promise<any> {
  try {
    // Only track statistics if explicitly requested to do so
    if (!isChromeExtension() && process.env.NODE_ENV !== 'development') {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/extension/statistics/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        installationId,
        blockedDelta,
        hiddenDelta,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update statistics: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating statistics:', error);
    return null;
  }
}

/**
 * Get statistics from the server
 */
export async function getStatistics(installationId: string): Promise<any> {
  try {
    // Only call the API if we're in development mode or running as a Chrome extension
    if (!isChromeExtension() && process.env.NODE_ENV !== 'development') {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/extension/statistics/${installationId}`);

    if (!response.ok) {
      throw new Error(`Failed to get statistics: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting statistics:', error);
    return null;
  }
}

/**
 * Reset statistics on the server
 */
export async function resetStatistics(installationId: string): Promise<any> {
  try {
    // Only call the API if we're in development mode or running as a Chrome extension
    if (!isChromeExtension() && process.env.NODE_ENV !== 'development') {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/extension/statistics/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        installationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to reset statistics: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error resetting statistics:', error);
    return null;
  }
}