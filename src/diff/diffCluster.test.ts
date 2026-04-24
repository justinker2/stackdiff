import { clusterDiff, formatClusterReport, resolveClusterKey } from './diffCluster';
import type { DiffEntry } from './diffFilter';

function makeEntry(path: string, change: string): DiffEntry {
  return { path, change, leftType: 'string', rightType: 'string' } as DiffEntry;
}

describe('resolveClusterKey', () => {
  it('returns first N segments joined by dot', () => {
    expect(resolveClusterKey('user.profile.name', 2)).toBe('user.profile');
  });

  it('returns full path when depth exceeds segments', () => {
    expect(resolveClusterKey('user', 3)).toBe('user');
  });

  it('returns (root) for empty path', () => {
    expect(resolveClusterKey('', 2)).toBe('(root)');
  });
});

describe('clusterDiff', () => {
  const entries: DiffEntry[] = [
    makeEntry('user.name', 'changed'),
    makeEntry('user.email', 'added'),
    makeEntry('user.age', 'removed'),
    makeEntry('order.id', 'changed'),
    makeEntry('order.total', 'changed'),
  ];

  it('groups entries by prefix depth', () => {
    const clusters = clusterDiff(entries, { prefixDepth: 1 });
    const keys = clusters.map(c => c.key);
    expect(keys).toContain('user');
    expect(keys).toContain('order');
  });

  it('counts change types per cluster', () => {
    const clusters = clusterDiff(entries, { prefixDepth: 1 });
    const user = clusters.find(c => c.key === 'user')!;
    expect(user.changeTypes['changed']).toBe(1);
    expect(user.changeTypes['added']).toBe(1);
    expect(user.changeTypes['removed']).toBe(1);
  });

  it('respects minSize filter', () => {
    const clusters = clusterDiff(entries, { prefixDepth: 1, minSize: 3 });
    expect(clusters.every(c => c.entries.length >= 3)).toBe(true);
  });

  it('sorts clusters by descending entry count', () => {
    const clusters = clusterDiff(entries, { prefixDepth: 1 });
    for (let i = 1; i < clusters.length; i++) {
      expect(clusters[i - 1].entries.length).toBeGreaterThanOrEqual(clusters[i].entries.length);
    }
  });

  it('returns empty array for no entries', () => {
    expect(clusterDiff([])).toEqual([]);
  });
});

describe('formatClusterReport', () => {
  it('returns fallback message for empty clusters', () => {
    expect(formatClusterReport([])).toBe('No clusters found.');
  });

  it('includes cluster key and entry paths', () => {
    const clusters = clusterDiff(
      [makeEntry('api.status', 'added'), makeEntry('api.version', 'changed')],
      { prefixDepth: 1 }
    );
    const report = formatClusterReport(clusters);
    expect(report).toContain('api');
    expect(report).toContain('api.status');
    expect(report).toContain('api.version');
  });
});
