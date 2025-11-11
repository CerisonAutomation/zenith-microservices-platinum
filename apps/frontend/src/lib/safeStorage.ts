/**
 * 🔒 SAFE STORAGE UTILITIES
 * Bulletproof localStorage/sessionStorage with error handling
 */

export interface StorageResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

/**
 * Safely get item from storage with JSON parsing
 */
export function safeGetItem<T>(key: string, fallbackStorage: boolean = true): StorageResult<T> {
  try {
    // Try localStorage first
    const item = localStorage.getItem(key);
    if (item) {
      try {
        const data = JSON.parse(item) as T;
        return { success: true, data };
      } catch (parseError) {
        console.error(`Failed to parse ${key} from localStorage:`, parseError);
        // Clear corrupted data
        localStorage.removeItem(key);
        return { success: false, data: null, error: 'Invalid JSON' };
      }
    }

    // Try sessionStorage as fallback
    if (fallbackStorage) {
      const sessionItem = sessionStorage.getItem(key);
      if (sessionItem) {
        try {
          const data = JSON.parse(sessionItem) as T;
          return { success: true, data };
        } catch (parseError) {
          console.error(`Failed to parse ${key} from sessionStorage:`, parseError);
          sessionStorage.removeItem(key);
          return { success: false, data: null, error: 'Invalid JSON' };
        }
      }
    }

    return { success: false, data: null };
  } catch (error) {
    console.error(`Storage access failed for ${key}:`, error);
    return { success: false, data: null, error: 'Storage unavailable' };
  }
}

/**
 * Safely set item in storage with JSON serialization
 */
export function safeSetItem(key: string, value: any, fallbackStorage: boolean = true): boolean {
  try {
    const serialized = JSON.stringify(value);

    // Try localStorage first
    try {
      localStorage.setItem(key, serialized);
      return true;
    } catch (storageError: any) {
      console.warn(`localStorage failed for ${key}:`, storageError);

      // Check if quota exceeded
      if (storageError.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded');

        // Try to clear old data
        try {
          clearOldGuestSessions();
          localStorage.setItem(key, serialized);
          return true;
        } catch {
          // Still failed, try sessionStorage
        }
      }

      // Fallback to sessionStorage
      if (fallbackStorage) {
        try {
          sessionStorage.setItem(key, serialized);
          console.log(`Fell back to sessionStorage for ${key}`);
          return true;
        } catch (sessionError) {
          console.error(`Both localStorage and sessionStorage failed for ${key}`);
          return false;
        }
      }

      return false;
    }
  } catch (error) {
    console.error(`Failed to serialize data for ${key}:`, error);
    return false;
  }
}

/**
 * Safely remove item from storage
 */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key} from localStorage:`, error);
  }

  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key} from sessionStorage:`, error);
  }
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear old guest sessions to free up space
 */
export function clearOldGuestSessions(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = new Date().getTime();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    keys.forEach(key => {
      if (key.startsWith('zenith_guest_') || key.startsWith('zenith_chat_history_guest_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);

            // Remove if older than 7 days
            if (data.timestamp && data.timestamp < sevenDaysAgo) {
              localStorage.removeItem(key);
              console.log(`Cleared old guest session: ${key}`);
            }
          }
        } catch {
          // Invalid data, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Failed to clear old guest sessions:', error);
  }
}

/**
 * Get storage usage info (for debugging)
 */
export function getStorageInfo(): { used: number; available: number; percentage: number } {
  try {
    const test = 'a'.repeat(1024); // 1KB
    let used = 0;

    Object.keys(localStorage).forEach(key => {
      used += (localStorage.getItem(key) || '').length + key.length;
    });

    // Rough estimate: most browsers have 5-10MB localStorage
    const estimatedTotal = 5 * 1024 * 1024; // 5MB
    const percentage = (used / estimatedTotal) * 100;

    return {
      used,
      available: estimatedTotal - used,
      percentage: Math.round(percentage)
    };
  } catch {
    return { used: 0, available: 0, percentage: 0 };
  }
}
