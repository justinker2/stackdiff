import { flattenDiff, formatFlattenReport, pathDepth, leafSegment, truncateToDepth } from './diffFlatten';
import type { DiffEntry } from './diffCache';

function makeEntry(path: string, change = 'added'): DiffEntry {
  return { path, change, left: null, right: 'string' } as unknown as DiffEntry;
}

describe('pathDepth', () => {
  it('returns 1 for a simple key', () => expect(pathDepth('foo')).toBe(1));
  it('returns 3 for a.b.c', () => expect(pathDepth('a.b.c')).toBe(3));
});

describe('leafSegment', () => {
  it('returns last segment', () => expect(leafSegment('a.b.c')).toBe('c'));
  it('returns whole string when no separator', () => expect(leafSegment('foo')).toBe('foo'));
});

describe('truncateToDepth', () => {
  it('truncates to requested depth', () => {
    expect(truncateToDepth('a.b.c.d', 2)).toBe('a.b');
  });
  it('returns full path when depth >= length', () => {
    expect(truncateToDepth('a.b', 5)).toBe('a.b');
  });
});

describe('flattenDiff', () => {
  const entries = [
    makeEntry('a.b.c.d', 'added'),
    makeEntry('a.b.c.e', 'removed'),
    makeEntry('x.y', 'changed'),
  ];

  it('returns all entries without maxDepth', () => {
    const result = flattenDiff(entries);
    expect(result).toHaveLength(3);
  });

  it('collapses deep paths with maxDepth', () => {
    const result = flattenDiff(entries, { maxDepth: 2 });
    // a.b.c.d and a.b.c.e both collapse to a.b.…
    expect(result.some((e) => e.path === 'a.b.…')).toBe(true);
    expect(result.some((e) => e.path === 'x.y')).toBe(true);
  });

  it('deduplicates collapsed paths', () => {
    const result = flattenDiff(entries, { maxDepth: 2 });
    const collapsed = result.filter((e) => e.path === 'a.b.…');
    expect(collapsed).toHaveLength(1);
  });

  it('records correct depth', () => {
    const result = flattenDiff([makeEntry('a.b.c')], { maxDepth: 2 });
    expect(result[0].depth).toBe(2);
  });
});

describe('formatFlattenReport', () => {
  it('returns empty message for no entries', () => {
    expect(formatFlattenReport([])).toMatch(/No entries/);
  });

  it('includes count and path info', () => {
    const flat = flattenDiff([makeEntry('a.b', 'added')]);
    const report = formatFlattenReport(flat);
    expect(report).toMatch(/1 unique paths/);
    expect(report).toMatch('a.b');
  });
});
