// Caching system for drafts (6-hour TTL per PRD)

export interface CacheEntry<T> {
  data: T;
  expiresAt: Date;
  hitCount: number;
  createdAt: Date;
}

export class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly ttlMs: number;
  private readonly name: string;

  constructor(name: string, ttlMinutes: number = 360) { // 6 hours default
    this.name = name;
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  set(key: string, data: T): void {
    const expiresAt = new Date(Date.now() + this.ttlMs);
    this.cache.set(key, {
      data,
      expiresAt,
      hitCount: 0,
      createdAt: new Date()
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt.getTime()) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt.getTime()) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[${this.name}] Cleaned up ${removed} expired entries`);
    }

    return removed;
  }

  getStats() {
    this.cleanup(); // Clean before stats

    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, e) => sum + e.hitCount, 0),
      averageHits: entries.length > 0 ? entries.reduce((sum, e) => sum + e.hitCount, 0) / entries.length : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.createdAt.getTime())) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.createdAt.getTime())) : null
    };
  }

  getAllEntries() {
    return Array.from(this.cache.entries());
  }
}

// Global cache instances
export const draftCache = new Cache('DraftCache', 360); // 6 hours
export const personaCache = new Cache('PersonaCache', 1440); // 24 hours (lifetime for user)
export const summaryCache = new Cache('SummaryCache', 360); // 6 hours
export const classificationCache = new Cache('ClassificationCache', 240); // 4 hours

// Cleanup task (run every hour)
export function setupCacheCleanup(): NodeJS.Timer {
  return setInterval(() => {
    console.log('[Cache Cleanup] Running scheduled cleanup...');
    draftCache.cleanup();
    personaCache.cleanup();
    summaryCache.cleanup();
    classificationCache.cleanup();
  }, 60 * 60 * 1000); // Every hour
}

// For Redis integration in production
export interface RedisCache {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

// Stub for future Redis integration
export function createRedisCache(redisUrl: string): RedisCache {
  // TODO: Implement with redis client
  // For now, return memory cache
  const memCache = new Cache('RedisStub', 360);

  return {
    async get(key: string) {
      return memCache.get(key);
    },
    async set(key: string, value: any) {
      memCache.set(key, value);
    },
    async delete(key: string) {
      return memCache.delete(key);
    },
    async clear() {
      memCache.clear();
    }
  };
}
