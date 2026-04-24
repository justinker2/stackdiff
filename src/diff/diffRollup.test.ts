import { rollupDiff, truncatePath, formatRollupReport } from './diffRollup';
import type { DiffEntry } from './diffFilter';

function makeEntry(path: string, change: DiffEntry['change']): DiffEntry {
  return { path, change, left: 'string', right: change === 'removed' ? undefined : 'number' };
}

describe('truncatePath', () => {
  it('returns first N segments', () => {
    expect(truncatePath('a.b.c.d', 2)).toBe('a.b');
  });

  it('returns full path when depth exceeds segments', () => {
    expect(truncatePath('a.b', 5)).toBe('a.b');
  });

  it('handles single segment', () => {
    expect(truncatePath('root', 2)).toBe('root');
  });
});

describe('rollupDiff', () => {
  const entries: DiffEntry[] = [
    makeEntry('user.name', 'changed'),
    makeEntry('user.email', 'added'),
    makeEntry('user.address.city', 'removed'),
    makeEntry('product.price', 'changed'),
    makeEntry('product.sku', 'added'),
  ];

  it('groups entries by prefix at default depth 2', () => {
    const result = rollupDiff(entries);
    expect(result.depth).toBe(2);
    expect(result.buckets).toHaveLength(2);
    const user = result.buckets.find((b) => b.prefix === 'user')!;
    expect(user.total).toBe(3);
    expect(user.added).toBe(1);
    expect(user.removed).toBe(1);
    expect(user.changed).toBe(1);
  });

  it('respects custom depth', () => {
    const result = rollupDiff(entries, 1);
    expect(result.buckets).toHaveLength(2);
  });

  it('returns empty buckets for empty input', () => {
    const result = rollupDiff([]);
    expect(result.buckets).toHaveLength(0);
  });

  it('sorts buckets alphabetically', () => {
    const result = rollupDiff(entries);
    expect(result.buckets[0].prefix).toBe('product');
    expect(result.buckets[1].prefix).toBe('user');
  });
});

describe('formatRollupReport', () => {
  it('returns message for empty result', () => {
    expect(formatRollupReport({ buckets: [], depth: 2 })).toBe('No differences to roll up.');
  });

  it('includes depth header and bucket rows', () => {
    const entries: DiffEntry[] = [makeEntry('a.b', 'added')];
    const result = rollupDiff(entries, 2);
    const report = formatRollupReport(result);
    expect(report).toContain('Rollup at depth 2');
    expect(report).toContain('+1 added');
    expect(report).toContain('a');
  });
});
