/** Typed localStorage helpers: plain persisted values plus a TTL-based cache for API responses. */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable (private browsing) — fail silently, app stays usable
  }
}

export const storage = { read, write }

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const CACHE_PREFIX = 'cine-planer:cache:'

/** Read a cached value if present and not expired. */
export function readCache<T>(key: string): T | null {
  const entry = read<CacheEntry<T> | null>(CACHE_PREFIX + key, null)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) return null
  return entry.value
}

export function writeCache<T>(key: string, value: T, ttlMs: number): void {
  const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs }
  write(CACHE_PREFIX + key, entry)
}

/** Fetch-or-compute wrapper: serves cached data when fresh, otherwise calls `loader` and caches the result. */
export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = readCache<T>(key)
  if (hit !== null) return hit
  const value = await loader()
  writeCache(key, value, ttlMs)
  return value
}
