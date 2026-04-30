import { computeChurn, formatChurnReport } from './diffChurn';
import type { DiffEntry } from './diffFilter';

function makeEntry(path: string, change = 'modified'): DiffEntry {
  return { path, change, from: 'string', to: 'number' };
}

describe('computeChurn', () => {
  it('returns empty entries for empty diffs', () => {
    const report = computeChurn([]);
    expect(report.totalDiffs).toBe(0);
    expect(report.entries).toEqual([]);
    expect(report.hotspots).toEqual([]);
  });

  it('counts path occurrences across multiple diffs', () => {
    const diff1 = [makeEntry('a.b'), makeEntry('a.c')];
    const diff2 = [makeEntry('a.b')];
    const report = computeChurn([diff1, diff2]);
    expect(report.totalDiffs).toBe(2);
    const ab = report.entries.find((e) => e.path === 'a.b')!;
    expect(ab.count).toBe(2);
    expect(ab.churnRate).toBeCloseTo(1.0);
    const ac = report.entries.find((e) => e.path === 'a.c')!;
    expect(ac.count).toBe(1);
    expect(ac.churnRate).toBeCloseTo(0.5);
  });

  it('sorts entries by count descending', () => {
    const diff1 = [makeEntry('x'), makeEntry('y'), makeEntry('y')];
    const report = computeChurn([diff1]);
    expect(report.entries[0].path).toBe('y');
    expect(report.entries[1].path).toBe('x');
  });

  it('identifies hotspots above threshold', () => {
    const diff1 = [makeEntry('hot')];
    const diff2 = [makeEntry('hot')];
    const diff3 = [makeEntry('cold')];
    const report = computeChurn([diff1, diff2, diff3], 0.5);
    expect(report.hotspots.map((e) => e.path)).toContain('hot');
    expect(report.hotspots.map((e) => e.path)).not.toContain('cold');
  });

  it('records all change types per path', () => {
    const diff1 = [makeEntry('p', 'added')];
    const diff2 = [makeEntry('p', 'removed')];
    const report = computeChurn([diff1, diff2]);
    const p = report.entries[0];
    expect(p.changeTypes).toContain('added');
    expect(p.changeTypes).toContain('removed');
  });
});

describe('formatChurnReport', () => {
  it('shows no-changes message for empty report', () => {
    const report = computeChurn([]);
    expect(formatChurnReport(report)).toContain('No changes detected.');
  });

  it('includes path and rate in output', () => {
    const diff1 = [makeEntry('foo.bar')];
    const report = computeChurn([diff1]);
    const output = formatChurnReport(report);
    expect(output).toContain('foo.bar');
    expect(output).toContain('100.0%');
  });

  it('marks hotspots with flame emoji', () => {
    const diff1 = [makeEntry('hot')];
    const diff2 = [makeEntry('hot')];
    const report = computeChurn([diff1, diff2]);
    expect(formatChurnReport(report)).toContain('🔥');
  });

  it('reports hotspot count in summary line', () => {
    const report = computeChurn([[makeEntry('a')], [makeEntry('a')]]);
    expect(formatChurnReport(report)).toMatch(/Hotspots.*: 1/);
  });
});
