import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const CACHE_DIR = path.join(process.env.HOME || '.', '.stackdiff', 'cache');

export interface CacheEntry {
  url: string;
  shape: Record<string, unknown>;
  fetchedAt: string;
}

export function getCacheKey(url: string, headers: Record<string, string> = {}): string {
  const raw = JSON.stringify({ url, headers });
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function readCache(key: string): CacheEntry | null {
  const file = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

export function writeCache(key: string, entry: CacheEntry): void {
  ensureCacheDir();
  const file = path.join(CACHE_DIR, `${key}.json`);
  fs.writeFileSync(file, JSON.stringify(entry, null, 2), 'utf-8');
}

export function clearCache(): void {
  if (!fs.existsSync(CACHE_DIR)) return;
  for (const f of fs.readdirSync(CACHE_DIR)) {
    if (f.endsWith('.json')) {
      fs.unlinkSync(path.join(CACHE_DIR, f));
    }
  }
}

export function isCacheFresh(entry: CacheEntry, maxAgeMs: number): boolean {
  const fetched = new Date(entry.fetchedAt).getTime();
  return Date.now() - fetched < maxAgeMs;
}
