import { AiInsightOutput } from "./ai-insight-schema";

export interface CachedInsightEntry {
  output: AiInsightOutput;
  timestamp: number;
  provider: string;
  model: string;
}

export class AiInsightCache {
  private static cache = new Map<string, CachedInsightEntry>();
  private static defaultTtlMs = 15 * 60 * 1000; // 15 minutes
  private static hits = 0;
  private static misses = 0;

  /**
   * Generates a unique cache key based on period dates, provider, and model.
   */
  static generateKey(
    startDateStr: string | undefined | null,
    endDateStr: string | undefined | null,
    provider: string,
    model: string
  ): string {
    const start = startDateStr || "all-start";
    const end = endDateStr || "all-end";
    return `ai-insight:${provider}:${model}:${start}:${end}`;
  }

  /**
   * Retrieves a cached insight if valid and not expired.
   */
  static get(key: string, ttlMs: number = AiInsightCache.defaultTtlMs): AiInsightOutput | null {
    const entry = AiInsightCache.cache.get(key);
    if (!entry) {
      AiInsightCache.misses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > ttlMs) {
      AiInsightCache.cache.delete(key);
      AiInsightCache.misses++;
      return null;
    }

    AiInsightCache.hits++;
    return entry.output;
  }

  /**
   * Stores an insight output in the cache.
   */
  static set(key: string, output: AiInsightOutput, provider: string, model: string): void {
    AiInsightCache.cache.set(key, {
      output,
      timestamp: Date.now(),
      provider,
      model,
    });
  }

  /**
   * Clears all cached entries (useful for testing).
   */
  static clear(): void {
    AiInsightCache.cache.clear();
    AiInsightCache.hits = 0;
    AiInsightCache.misses = 0;
  }

  /**
   * Returns current cache hit/miss statistics.
   */
  static getStats(): { hits: number; misses: number; size: number } {
    return {
      hits: AiInsightCache.hits,
      misses: AiInsightCache.misses,
      size: AiInsightCache.cache.size,
    };
  }
}
