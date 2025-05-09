type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache: Record<string, CacheEntry<any>> = {};
const DEFAULT_TTL = 5 * 60 * 1000; // Default TTL: 5 minutes

export const getFromCache = <T>(key: string): T | null => {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < DEFAULT_TTL) {
    return entry.data;
  }
  return null;
};

export const setToCache = <T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): void => {
  cache[key] = { data, timestamp: Date.now() };
};

export const clearCache = (key: string): void => {
  delete cache[key];
};
