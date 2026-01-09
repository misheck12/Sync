/**
 * Redis Cache Service for Multi-Tenant Architecture
 * Provides caching for tenant configs, sessions, and frequently accessed data
 */

import Redis from 'ioredis';

// Redis client initialization
let redis: Redis | null = null;

const getRedisClient = (): Redis | null => {
    if (!process.env.REDIS_URL) {
        console.log('Redis not configured - caching disabled');
        return null;
    }

    if (!redis) {
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            lazyConnect: true,
        });

        redis.on('error', (err) => {
            console.error('Redis connection error:', err);
        });

        redis.on('connect', () => {
            console.log('✅ Redis connected');
        });
    }

    return redis;
};

// ==========================================
// TENANT CACHING
// ==========================================

interface TenantConfig {
    id: string;
    name: string;
    slug: string;
    tier: string;
    status: string;
    maxStudents: number;
    maxTeachers: number;
    maxUsers: number;
    smsEnabled: boolean;
    emailEnabled: boolean;
    [key: string]: any;
}

/**
 * Get tenant configuration from cache or database
 * Cache TTL: 5 minutes
 */
export const getTenantConfig = async (tenantId: string): Promise<TenantConfig | null> => {
    const client = getRedisClient();

    if (client) {
        try {
            const cached = await client.get(`tenant:${tenantId}:config`);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('Redis get error:', error);
        }
    }

    return null;
};

/**
 * Cache tenant configuration
 */
export const setTenantConfig = async (tenantId: string, config: TenantConfig): Promise<void> => {
    const client = getRedisClient();

    if (client) {
        try {
            await client.setex(`tenant:${tenantId}:config`, 300, JSON.stringify(config));
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }
};

/**
 * Invalidate tenant configuration cache
 */
export const invalidateTenantConfig = async (tenantId: string): Promise<void> => {
    const client = getRedisClient();

    if (client) {
        try {
            await client.del(`tenant:${tenantId}:config`);
        } catch (error) {
            console.error('Redis del error:', error);
        }
    }
};

// ==========================================
// DOMAIN/SUBDOMAIN LOOKUP CACHING
// ==========================================

/**
 * Get tenant by domain (custom domain or subdomain)
 * Cache TTL: 10 minutes
 */
export const getTenantByDomain = async (domain: string): Promise<string | null> => {
    const client = getRedisClient();

    if (client) {
        try {
            return await client.get(`domain:${domain}`);
        } catch (error) {
            console.error('Redis get error:', error);
        }
    }

    return null;
};

/**
 * Cache domain to tenant mapping
 */
export const setTenantDomain = async (domain: string, tenantId: string): Promise<void> => {
    const client = getRedisClient();

    if (client) {
        try {
            await client.setex(`domain:${domain}`, 600, tenantId);
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }
};

// ==========================================
// RATE LIMITING SUPPORT
// ==========================================

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;
}

/**
 * Check rate limit for a key
 * Uses sliding window algorithm
 */
export const checkRateLimit = async (
    key: string,
    limit: number,
    windowMs: number
): Promise<RateLimitResult> => {
    const client = getRedisClient();

    if (!client) {
        // If Redis is not available, allow all requests
        return { allowed: true, remaining: limit, resetIn: 0 };
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `ratelimit:${key}`;

    try {
        // Remove old entries and count current window
        await client.zremrangebyscore(redisKey, 0, windowStart);
        const count = await client.zcard(redisKey);

        if (count >= limit) {
            const oldestEntry = await client.zrange(redisKey, 0, 0, 'WITHSCORES');
            const resetIn = oldestEntry[1] ? parseInt(oldestEntry[1]) + windowMs - now : windowMs;

            return {
                allowed: false,
                remaining: 0,
                resetIn: Math.max(0, resetIn),
            };
        }

        // Add current request
        await client.zadd(redisKey, now, `${now}:${Math.random()}`);
        await client.pexpire(redisKey, windowMs);

        return {
            allowed: true,
            remaining: limit - count - 1,
            resetIn: windowMs,
        };
    } catch (error) {
        console.error('Rate limit check error:', error);
        return { allowed: true, remaining: limit, resetIn: 0 };
    }
};

// ==========================================
// SESSION CACHING
// ==========================================

interface SessionData {
    userId: string;
    tenantId: string;
    role: string;
    [key: string]: any;
}

/**
 * Get session data from cache
 */
export const getSession = async (sessionId: string): Promise<SessionData | null> => {
    const client = getRedisClient();

    if (client) {
        try {
            const data = await client.get(`session:${sessionId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Redis get error:', error);
        }
    }

    return null;
};

/**
 * Set session data in cache
 * TTL: 24 hours
 */
export const setSession = async (sessionId: string, data: SessionData): Promise<void> => {
    const client = getRedisClient();

    if (client) {
        try {
            await client.setex(`session:${sessionId}`, 86400, JSON.stringify(data));
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }
};

/**
 * Delete session from cache
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
    const client = getRedisClient();

    if (client) {
        try {
            await client.del(`session:${sessionId}`);
        } catch (error) {
            console.error('Redis del error:', error);
        }
    }
};

// ==========================================
// USAGE METRICS CACHING
// ==========================================

/**
 * Increment usage metric counter
 * Flushes to database periodically
 */
export const incrementUsageMetric = async (
    tenantId: string,
    metricType: string,
    value: number = 1
): Promise<void> => {
    const client = getRedisClient();

    if (client) {
        try {
            const key = `usage:${tenantId}:${metricType}:${new Date().toISOString().slice(0, 10)}`;
            await client.incrby(key, value);
            await client.expire(key, 86400 * 2); // 2 days TTL
        } catch (error) {
            console.error('Redis incr error:', error);
        }
    }
};

/**
 * Get usage metric value
 */
export const getUsageMetric = async (
    tenantId: string,
    metricType: string,
    date?: string
): Promise<number> => {
    const client = getRedisClient();

    if (client) {
        try {
            const dateKey = date || new Date().toISOString().slice(0, 10);
            const key = `usage:${tenantId}:${metricType}:${dateKey}`;
            const value = await client.get(key);
            return value ? parseInt(value) : 0;
        } catch (error) {
            console.error('Redis get error:', error);
        }
    }

    return 0;
};

// ==========================================
// GENERAL CACHE UTILITIES
// ==========================================

/**
 * Generic cache get
 */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
    const client = getRedisClient();

    if (client) {
        try {
            const data = await client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Redis get error:', error);
        }
    }

    return null;
};

/**
 * Generic cache set with TTL
 */
export const cacheSet = async (key: string, value: any, ttlSeconds: number): Promise<void> => {
    const client = getRedisClient();

    if (client) {
        try {
            await client.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }
};

/**
 * Delete a cache key
 */
export const cacheDel = async (key: string): Promise<void> => {
    const client = getRedisClient();

    if (client) {
        try {
            await client.del(key);
        } catch (error) {
            console.error('Redis del error:', error);
        }
    }
};

/**
 * Delete keys by pattern
 */
export const cacheDelPattern = async (pattern: string): Promise<void> => {
    const client = getRedisClient();

    if (client) {
        try {
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(...keys);
            }
        } catch (error) {
            console.error('Redis del pattern error:', error);
        }
    }
};

export default {
    getTenantConfig,
    setTenantConfig,
    invalidateTenantConfig,
    getTenantByDomain,
    setTenantDomain,
    checkRateLimit,
    getSession,
    setSession,
    deleteSession,
    incrementUsageMetric,
    getUsageMetric,
    cacheGet,
    cacheSet,
    cacheDel,
    cacheDelPattern,
};
