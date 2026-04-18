import * as fs from 'fs';
import * as path from 'path';
import {
  getCacheKey,
  readCache,
  writeCache,
  clearCache,
  isCacheFresh,
  CacheEntry,
} from './diffCache';

const CACHE_DIR = path.join(process.env.HOME || '.', '.stackdiff', 'cache');

function makeEntry(url: string): CacheEntry {
  return { url, shape: { id: 'number', name: 'string' }, fetchedAt: new Date().toISOString() };
}

beforeEach(() => {
  clearCache();
});

afterAll(() => {
  clearCache();
});

describe('getCacheKey', () => {
  it('returns a 16-char hex string', () => {
    const key = getCacheKey('https://api.example.com/users');
    expect(key).toMatch(/^[a-f0-9]{16}$/);
  });

  it('differs when headers differ', () => {
    const k1 = getCacheKey('https://api.example.com', { Authorization: 'a' });
    const k2 = getCacheKey('https://api.example.com', { Authorization: 'b' });
    expect(k1).not.toBe(k2);
  });
});

describe('writeCache / readCache', () => {
  it('round-trips a cache entry', () => {
    const key = getCacheKey('https://api.example.com/items');
    const entry = makeEntry('https://api.example.com/items');
    writeCache(key, entry);
    const result = readCache(key);
    expect(result).toEqual(entry);
  });

  it('returns null for missing key', () => {
    expect(readCache('nonexistentkey123456')).toBeNull();
  });
});

describe('clearCache', () => {
  it('removes all cached files', () => {
    const key = getCacheKey('https://api.example.com/clear-test');
    writeCache(key, makeEntry('https://api.example.com/clear-test'));
    clearCache();
    expect(readCache(key)).toBeNull();
  });
});

describe('isCacheFresh', () => {
  it('returns true when entry is recent', () => {
    const entry = makeEntry('https://api.example.com');
    expect(isCacheFresh(entry, 60_000)).toBe(true);
  });

  it('returns false when entry is stale', () => {
    const old = new Date(Date.now() - 120_000).toISOString();
    const entry: CacheEntry = { url: 'x', shape: {}, fetchedAt: old };
    expect(isCacheFresh(entry, 60_000)).toBe(false);
  });
});
