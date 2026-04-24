import { truncatePath, rollupDiff, formatRollupReport } from './diffRollup';
import type { DiffEntry } from './shapeDiff';

function makeEntry(path: string, change: DiffEntry['change'], a?: string, b?: string): DiffEntry {
  return { path, change, typeA: a ?? 'string', typeB: b ?? 'string' };
}

describe('truncatePath', () => {
  it('returns path unchanged when depth is large', () => {
    expect(truncatePath('a.b.c.d', 10)).toBe('a.b.c.d');
  });

  it('truncates to specified depth', () => {
    expect(truncatePath('a.b.c.d', 2)).toBe('a.b');
  });

  it('handles single segment', () => {
    expect(truncatePath('root', 1)).toBe('root');
  });

  it('handles depth of zero by returning first segment', () => {
    expect(truncatePath('a.b.c', 0)).toBe('a');
  });
});

describe('rollupDiff', () => {
  it('groups entries under common prefix at given depth', () => {
    const entries: DiffEntry[] = [
      makeEntry('user.name', 'added'),
      makeEntry('user.email', 'removed'),
      makeEntry('user.address.city', 'changed', 'string', 'number'),
    ];
    const result = rollupDiff(entries, 1);
    expect(result.size).toBe(1);
    const group = result.get('user')!;
    expect(group).toHaveLength(3);
  });

  it('separates entries with different top-level keys', () => {
    const entries: DiffEntry[] = [
      makeEntry('user.name', 'added'),
      makeEntry('product.sku', 'removed'),
    ];
    const result = rollupDiff(entries, 1);
    expect(result.size).toBe(2);
    expect(result.has('user')).toBe(true);
    expect(result.has('product')).toBe(true);
  });

  it('uses deeper depth to distinguish sub-groups', () => {
    const entries: DiffEntry[] = [
      makeEntry('a.b.x', 'added'),
      makeEntry('a.c.y', 'removed'),
    ];
    const result = rollupDiff(entries, 2);
    expect(result.size).toBe(2);
    expect(result.has('a.b')).toBe(true);
    expect(result.has('a.c')).toBe(true);
  });

  it('returns empty map for empty input', () => {
    expect(rollupDiff([], 1).size).toBe(0);
  });
});

describe('formatRollupReport', () => {
  it('lists each group with a count summary', () => {
    const entries: DiffEntry[] = [
      makeEntry('user.name', 'added'),
      makeEntry('user.email', 'removed'),
      makeEntry('meta.version', 'changed', 'number', 'string'),
    ];
    const rolled = rollupDiff(entries, 1);
    const report = formatRollupReport(rolled);
    expect(report).toContain('user');
    expect(report).toContain('meta');
    expect(report).toContain('added: 1');
    expect(report).toContain('removed: 1');
    expect(report).toContain('changed: 1');
  });

  it('returns a message for empty rollup', () => {
    const report = formatRollupReport(new Map());
    expect(report).toMatch(/no entries/i);
  });
});
