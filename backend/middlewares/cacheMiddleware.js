/**
 * Redis-based Cache Middleware
 * Production-ready with graceful fallback
 */
import cacheService from "../services/cacheService.js";

/**
 * Cache middleware for Express routes
 * @param {Object} options - Configuration options
 * @param {number} options.ttl - Time to live in seconds (default: 300)
 * @param {string} options.prefix - Cache key prefix (default: 'api')
 * @param {string[]} options.excludeParams - Query params to exclude from cache key
 */
export const cacheMiddleware = (options = {}) => {
  const { ttl = 300, prefix = "api", excludeParams = [] } = options;

  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Skip if Redis is not available
    if (!cacheService.isConnected()) {
      return next();
    }

    // Build cache key
    const params = { ...req.query };
    excludeParams.forEach((param) => delete params[param]);

    const cacheKey = `${prefix}:${req.originalUrl}:${JSON.stringify(params)}`;

    try {
      // Try to get from cache
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        console.log(`✅ Cache hit: ${cacheKey.substring(0, 50)}...`);
        return res.json(cached);
      }

      console.log(`⏳ Cache miss: ${cacheKey.substring(0, 50)}...`);

      // Cache miss - proceed and cache response
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Don't cache error responses
        if (data && data.success !== false && !data.error) {
          cacheService.set(cacheKey, data, ttl).catch(console.error);
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error.message);
      next();
    }
  };
};

/**
 * Clear cache for a specific pattern
 * @param {string} pattern - Pattern to match (e.g., 'api:/api/products*')
 */
export const clearCache = async (pattern) => {
  if (!cacheService.isConnected()) return;
  try {
    await cacheService.delPattern(pattern || "*");
    console.log(`🗑️ Cache cleared for pattern: ${pattern || "*"}`);
  } catch (err) {
    console.error("Clear cache error:", err.message);
  }
};

/**
 * Invalidate product-related caches
 */
export const invalidateProductCache = async () => {
  await clearCache("api:/api/products*");
};

export default { cacheMiddleware, clearCache, invalidateProductCache };
