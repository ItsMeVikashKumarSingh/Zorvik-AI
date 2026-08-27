/**
 * Upstash Redis Client with Resilient In-Memory Fallback
 */
const { Redis } = require("@upstash/redis");

let redisClient = null;
const memoryStore = new Map();
const memoryExpiry = new Map();

const isUpstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

if (isUpstashConfigured) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.warn("Failed to initialize Upstash Redis, using memory fallback:", err.message);
    redisClient = null;
  }
}

/**
 * Clean up expired keys from in-memory fallback
 */
function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, expiry] of memoryExpiry.entries()) {
    if (now > expiry) {
      memoryStore.delete(key);
      memoryExpiry.delete(key);
    }
  }
}

setInterval(cleanupMemoryStore, 60000).unref();

const redis = {
  isConfigured: () => Boolean(redisClient),

  async get(key) {
    if (redisClient) {
      try {
        return await redisClient.get(key);
      } catch (err) {
        console.warn(`Upstash GET error for key ${key}, falling back to memory:`, err.message);
      }
    }
    const expiry = memoryExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      memoryStore.delete(key);
      memoryExpiry.delete(key);
      return null;
    }
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  },

  async set(key, value, options = {}) {
    if (redisClient) {
      try {
        if (options.ex) {
          return await redisClient.set(key, value, { ex: options.ex });
        }
        return await redisClient.set(key, value);
      } catch (err) {
        console.warn(`Upstash SET error for key ${key}, falling back to memory:`, err.message);
      }
    }
    memoryStore.set(key, value);
    if (options.ex) {
      memoryExpiry.set(key, Date.now() + options.ex * 1000);
    }
    return "OK";
  },

  async del(key) {
    if (redisClient) {
      try {
        return await redisClient.del(key);
      } catch (err) {
        console.warn(`Upstash DEL error for key ${key}:`, err.message);
      }
    }
    memoryExpiry.delete(key);
    return memoryStore.delete(key) ? 1 : 0;
  },

  async incr(key) {
    if (redisClient) {
      try {
        return await redisClient.incr(key);
      } catch (err) {
        console.warn(`Upstash INCR error for key ${key}:`, err.message);
      }
    }
    const val = (Number(memoryStore.get(key)) || 0) + 1;
    memoryStore.set(key, val);
    return val;
  },

  async expire(key, seconds) {
    if (redisClient) {
      try {
        return await redisClient.expire(key, seconds);
      } catch (err) {
        console.warn(`Upstash EXPIRE error for key ${key}:`, err.message);
      }
    }
    if (memoryStore.has(key)) {
      memoryExpiry.set(key, Date.now() + seconds * 1000);
      return 1;
    }
    return 0;
  },
};

module.exports = { redis };
