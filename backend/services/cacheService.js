/**
 * Redis Cache Service
 * Production-ready caching with graceful fallback for development
 */
import Redis from "ioredis";

class CacheService {
  constructor() {
    this.redis = null;
    this.connected = false;
    this.defaultTTL = 300; // 5 minutes
    this.initRedis();
  }

  initRedis() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true, // Don't connect immediately
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn("⚠️ Redis connection failed 3 times. Disabling Redis for this session.");
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000);
        },
      });

      this.redis.on("connect", () => {
        console.log("✅ Redis connected");
        this.connected = true;
      });

      this.redis.on("error", (err) => {
        console.warn("⚠️ Redis error (falling back to no-cache):", err.message);
        this.connected = false;
      });

      this.redis.on("close", () => {
        console.log("🔌 Redis connection closed");
        this.connected = false;
      });

      // Attempt connection
      this.redis.connect().catch((err) => {
        console.warn("⚠️ Redis not available, caching disabled:", err.message);
        this.connected = false;
      });
    } catch (err) {
      console.warn("⚠️ Redis initialization failed:", err.message);
      this.connected = false;
    }
  }

  async get(key) {
    if (!this.connected) return null;
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("Redis GET error:", err.message);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (!this.connected) return false;
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error("Redis SET error:", err.message);
      return false;
    }
  }

  async del(key) {
    if (!this.connected) return false;
    try {
      await this.redis.del(key);
      return true;
    } catch (err) {
      console.error("Redis DEL error:", err.message);
      return false;
    }
  }

  async delPattern(pattern) {
    if (!this.connected) return false;
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (err) {
      console.error("Redis DELPATTERN error:", err.message);
      return false;
    }
  }

  async flushAll() {
    if (!this.connected) return false;
    try {
      await this.redis.flushdb();
      console.log("🗑️ Redis cache flushed");
      return true;
    } catch (err) {
      console.error("Redis FLUSH error:", err.message);
      return false;
    }
  }

  // Check if Redis is available
  isConnected() {
    return this.connected;
  }

  // Graceful shutdown
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      console.log("🔌 Redis disconnected gracefully");
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

export default cacheService;
