import { computeStats, formatStats } from './diffStats';
import type { DiffEntry } from './diffAnnotate';

function makeEntry(path: string, change: DiffEntry['change']): DiffEntry {
  return { path, change, from: 'string', to: 'number' } as DiffEntry;
}

describe('computeStats', () => {
  it('counts each change type correctly', () => {
    const entries: DiffEntry[] = [
      makeEntry('a', 'added'),
      makeEntry('b', 'added'),
      makeEntry('c', 'removed'),
      makeEntry('d', 'changed'),
      makeEntry('e', 'unchanged'),
    ];
    const stats = computeStats(entries);
    expect(stats.total).toBe(5);
    expect(stats.added).toBe(2);
    expect(stats.removed).toBe(1);
    expect(stats.changed).toBe(1);
    expect(stats.unchanged).toBe(1);
  });

  it('collects paths by category', () => {
    const entries: DiffEntry[] = [
      makeEntry('x.foo', 'added'),
      makeEntry('x.bar', 'removed'),
      makeEntry('x.baz', 'changed'),
    ];
    const stats = computeStats(entries);
    expect(stats.addedPaths).toEqual(['x.foo']);
    expect(stats.removedPaths).toEqual(['x.bar']);
    expect(stats.changedPaths).toEqual(['x.baz']);
  });

  it('returns zeros for empty input', () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.added).toBe(0);
  });
});

describe('formatStats', () => {
  it('includes summary line', () => {
    const entries: DiffEntry[] = [makeEntry('a', 'added')];
    const output = formatStats(computeStats(entries));
    expect(output).toContain('Total fields');
    expect(output).toContain('Added      : 1');
  });

  it('lists added paths when present', () => {
    const entries: DiffEntry[] = [makeEntry('root.id', 'added')];
    const output = formatStats(computeStats(entries));
    expect(output).toContain('root.id');
  });

  it('omits path sections when empty', () => {
    const entries: DiffEntry[] = [makeEntry('x', 'unchanged')];
    const output = formatStats(computeStats(entries));
    expect(output).not.toContain('Added paths');
    expect(output).not.toContain('Removed paths');
  });
});
