import {
  buildLineage,
  buildAllLineages,
  formatLineageReport,
} from './diffLineage';
import type { DiffEntry } from './shapeDiff';

const snap1 = {
  timestamp: '2024-01-01T00:00:00Z',
  entries: [
    { path: 'user.name', change: 'added' as const, from: null, to: 'string' },
    { path: 'user.age', change: 'added' as const, from: null, to: 'number' },
  ] as DiffEntry[],
};

const snap2 = {
  timestamp: '2024-02-01T00:00:00Z',
  entries: [
    { path: 'user.name', change: 'changed' as const, from: 'string', to: 'string | null' },
  ] as DiffEntry[],
};

const snap3 = {
  timestamp: '2024-03-01T00:00:00Z',
  entries: [
    { path: 'user.age', change: 'removed' as const, from: 'number', to: null },
  ] as DiffEntry[],
};

describe('buildLineage', () => {
  it('returns points only for matching path', () => {
    const rec = buildLineage('user.name', [snap1, snap2, snap3]);
    expect(rec.path).toBe('user.name');
    expect(rec.points).toHaveLength(2);
    expect(rec.points[0].changeType).toBe('added');
    expect(rec.points[1].changeType).toBe('changed');
  });

  it('returns empty points when path never appears', () => {
    const rec = buildLineage('user.email', [snap1, snap2]);
    expect(rec.points).toHaveLength(0);
  });
});

describe('buildAllLineages', () => {
  it('collects all unique paths', () => {
    const records = buildAllLineages([snap1, snap2, snap3]);
    const paths = records.map((r) => r.path);
    expect(paths).toContain('user.name');
    expect(paths).toContain('user.age');
    expect(paths).toHaveLength(2);
  });

  it('returns empty array for empty snapshots', () => {
    expect(buildAllLineages([])).toEqual([]);
  });
});

describe('formatLineageReport', () => {
  it('returns no-data message for empty input', () => {
    expect(formatLineageReport([])).toBe('No lineage data.');
  });

  it('includes path and change info', () => {
    const records = buildAllLineages([snap1, snap2]);
    const report = formatLineageReport(records);
    expect(report).toContain('user.name');
    expect(report).toContain('added');
    expect(report).toContain('changed');
    expect(report).toContain('string → string | null');
  });

  it('shows (no recorded changes) when points empty', () => {
    const report = formatLineageReport([{ path: 'x.y', points: [] }]);
    expect(report).toContain('(no recorded changes)');
  });
});
