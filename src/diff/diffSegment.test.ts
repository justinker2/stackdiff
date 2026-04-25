import { segmentPath, segmentDiff, formatSegmentReport } from './diffSegment';
import type { DiffEntry } from './diffFilter';

function makeEntry(path: string, change: DiffEntry['change']): DiffEntry {
  return { path, change, left: 'string', right: change === 'added' ? 'number' : 'string' };
}

describe('segmentPath', () => {
  it('returns first segment at depth 1', () => {
    expect(segmentPath('user.profile.name', 1)).toBe('user');
  });

  it('returns two segments at depth 2', () => {
    expect(segmentPath('user.profile.name', 2)).toBe('user.profile');
  });

  it('handles a flat path', () => {
    expect(segmentPath('status', 1)).toBe('status');
  });

  it('does not exceed available parts', () => {
    expect(segmentPath('a.b', 10)).toBe('a.b');
  });
});

describe('segmentDiff', () => {
  const entries: DiffEntry[] = [
    makeEntry('user.id', 'changed'),
    makeEntry('user.name', 'removed'),
    makeEntry('meta.version', 'added'),
    makeEntry('meta.timestamp', 'added'),
    makeEntry('status', 'changed'),
  ];

  it('groups by top-level segment', () => {
    const result = segmentDiff(entries, 1);
    expect(result.size).toBe(3);
    expect(result.get('user')?.total).toBe(2);
    expect(result.get('meta')?.total).toBe(2);
    expect(result.get('status')?.total).toBe(1);
  });

  it('counts change types correctly', () => {
    const result = segmentDiff(entries, 1);
    const user = result.get('user')!;
    expect(user.changed).toBe(1);
    expect(user.removed).toBe(1);
    expect(user.added).toBe(0);

    const meta = result.get('meta')!;
    expect(meta.added).toBe(2);
  });

  it('returns empty map for empty input', () => {
    expect(segmentDiff([]).size).toBe(0);
  });
});

describe('formatSegmentReport', () => {
  it('returns fallback message for empty map', () => {
    expect(formatSegmentReport(new Map())).toBe('No segments found.');
  });

  it('includes segment names and counts', () => {
    const entries: DiffEntry[] = [
      makeEntry('user.id', 'added'),
      makeEntry('meta.ts', 'removed'),
    ];
    const result = formatSegmentReport(segmentDiff(entries, 1));
    expect(result).toContain('user');
    expect(result).toContain('meta');
    expect(result).toContain('+1');
    expect(result).toContain('-1');
  });
});
