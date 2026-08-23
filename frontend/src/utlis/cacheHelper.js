import axios from "axios";

/**
 * Smart Client-Side Cache Helper (Stale-While-Revalidate)
 * Saves prior data in sessionStorage so pages load in 0ms without waiting for API.
 * Background-revalidates to keep data synchronized when changes happen.
 */

const CACHE_PREFIX = "bitecheck_cache_";

export const getCachedData = (key) => {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data;
  } catch (e) {
    return null;
  }
};

export const setCachedData = (key, data) => {
  try {
    const payload = {
      timestamp: Date.now(),
      data: data
    };
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(payload));
  } catch (e) {
    console.warn("Cache storage error:", e);
  }
};

export const invalidateCache = (keyPrefix = "") => {
  try {
    if (!keyPrefix) {
      // Clear all bitecheck cache
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith(CACHE_PREFIX)) {
          sessionStorage.removeItem(k);
        }
      });
    } else {
      sessionStorage.removeItem(CACHE_PREFIX + keyPrefix);
    }
  } catch (e) {
    console.warn("Cache invalidation error:", e);
  }
};

/**
 * Fetch with instant cache return + background freshness update
 * @param {string} url - API Endpoint URL
 * @param {string} cacheKey - Unique key for cached resource
 * @param {Function} onData - Callback to update React state (called with cached data immediately, then with fresh data)
 */
export const fetchWithCache = async (url, cacheKey, onData) => {
  // 1. Immediately provide cached data if available (0ms instant display)
  const cached = getCachedData(cacheKey);
  if (cached !== null && cached !== undefined) {
    onData(cached, true); // true = from cache
  }

  // 2. Fetch fresh data from backend
  try {
    const res = await axios.get(url);
    const freshData = res.data;
    setCachedData(cacheKey, freshData);
    onData(freshData, false); // false = from network
    return freshData;
  } catch (err) {
    // If network fails or is slow, cached data is already displayed
    if (!cached) {
      throw err;
    }
  }
};
