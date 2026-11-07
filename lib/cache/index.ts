import "server-only";

import { Redis } from "@upstash/redis";

/**
 * A read-through cache in Upstash Redis, in front of Postgres.
 *
 * - Optional: without UPSTASH_REDIS_REST_URL / _TOKEN every call goes straight
 *   to the database, so local development needs no Redis.
 * - Fails open: if Redis is slow or down we log and read from the database.
 *   The cache can make a page faster, never break it.
 * - Writers call `invalidate` after a successful database write. TTLs bound
 *   how stale an entry can get if an invalidation is ever missed.
 */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// We serialize ourselves (see `encode`) so Dates survive the round trip.
const redis =
  url && token
    ? new Redis({
        url,
        token,
        automaticDeserialization: false,
        enableAutoPipelining: true,
        retry: { retries: 1, backoff: () => 50 },
      })
    : null;

/** Bump to drop every existing entry at once, e.g. when a cached shape changes. */
const PREFIX = "sfm:v1:";

/** A Redis call slower than this is abandoned in favor of the database. */
const TIMEOUT_MS = 1000;

export const cacheKeys = {
  user: (clerkId: string) => `user:${clerkId}`,
  userProperties: (userId: string) => `user-properties:${userId}`,
  menuList: (propertyId: string) => `menus:${propertyId}`,
  menuTree: (menuId: string) => `menu-tree:${menuId}`,
  publicMenu: (slug: string) => `public-menu:${slug}`,
  qrTarget: (code: string) => `qr:${code}`,
  mediaList: (propertyId: string) => `media:${propertyId}`,
};

/** Seconds. */
export const TTL = {
  minute: 60,
  tenMinutes: 60 * 10,
  hour: 60 * 60,
  day: 60 * 60 * 24,
} as const;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Redis timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS),
    ),
  ]);
}

/** JSON that keeps Dates: they're stored as {"$date": "<iso>"}. */
function encode(value: unknown): string {
  return JSON.stringify(value, function (this: Record<string, unknown>, key, current) {
    const raw = this[key];
    return raw instanceof Date ? { $date: raw.toISOString() } : current;
  });
}

function decode<T>(text: string): T {
  return JSON.parse(text, (_key, value) => {
    if (
      value !== null &&
      typeof value === "object" &&
      typeof value.$date === "string" &&
      Object.keys(value).length === 1
    ) {
      return new Date(value.$date);
    }
    return value;
  }) as T;
}

type CacheOptions = {
  /** Seconds to keep a value. */
  ttl: number;
  /**
   * Seconds to keep a null result (e.g. "no such menu"), which shields the
   * database from repeated lookups of missing keys. 0 skips caching nulls.
   */
  nullTtl?: number;
};

/** Returns the cached value for `key`, or loads it, caches it and returns it. */
export async function cached<T>(
  key: string,
  { ttl, nullTtl = 0 }: CacheOptions,
  load: () => Promise<T>,
): Promise<T> {
  if (!redis) return load();
  const fullKey = PREFIX + key;

  try {
    const hit = await withTimeout(redis.get<string>(fullKey));
    if (hit !== null && hit !== undefined) return decode<T>(hit);
  } catch (error) {
    console.warn(`Cache read failed for ${key}; using the database.`, error);
  }

  const value = await load();
  const expiry = value === null ? nullTtl : ttl;
  if (expiry > 0) {
    try {
      await withTimeout(redis.set(fullKey, encode(value), { ex: expiry }));
    } catch (error) {
      console.warn(`Cache write failed for ${key}.`, error);
    }
  }
  return value;
}

/** Stores a value we already have, e.g. the row a write just returned. */
export async function prime(key: string, value: unknown, ttl: number): Promise<void> {
  if (!redis) return;
  try {
    await withTimeout(redis.set(PREFIX + key, encode(value), { ex: ttl }));
  } catch (error) {
    console.warn(`Cache write failed for ${key}.`, error);
  }
}

/** Drops cached entries so the next read comes from the database. */
export async function invalidate(...keys: string[]): Promise<void> {
  if (!redis || keys.length === 0) return;
  const unique = [...new Set(keys)].map((key) => PREFIX + key);
  try {
    await withTimeout(redis.del(...unique));
  } catch (error) {
    // The TTL still expires the entry; log so a stale page can be explained.
    console.error(`Cache invalidation failed for ${unique.join(", ")}.`, error);
  }
}
