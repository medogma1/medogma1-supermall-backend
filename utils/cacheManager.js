// Cache Manager utility for in-memory caching with optional TTL (time-to-live)
// Useful for reducing redundant data fetches and improving performance
// Usage Example:
//   const cache = require('./cacheManager');
//   cache.set('key', value, 60000); // cache for 60 seconds
//   const value = cache.get('key');

/**
 * In-memory cache manager with TTL support.
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a value in the cache with optional TTL.
   * @param {string} key - Cache key.
   * @param {any} value - Value to cache.
   * @param {number} [ttl] - Time to live in ms.
   */
  set(key, value, ttl) {
    const expires = ttl ? Date.now() + ttl : null;
    this.cache.set(key, { value, expires });
  }

  /**
   * Get a value from the cache.
   * @param {string} key - Cache key.
   * @returns {any|null} - Cached value or null if not found/expired.
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expires && entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * Delete a value from the cache.
   * @param {string} key - Cache key.
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries.
   */
  clear() {
    this.cache.clear();
  }
}

module.exports = new CacheManager();