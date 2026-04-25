import { sampleDiff, formatSampleReport } from './diffSample';
import type { DiffEntry } from './shapeDiff';

function makeEntry(path: string, change: 'added' | 'removed' | 'changed'): DiffEntry {
  return {
    path,
    change,
    before: change === 'added' ? undefined : 'string',
    after: change === 'removed' ? undefined : 'number',
  };
}

const entries: DiffEntry[] = Array.from({ length: 20 }, (_, i) =>
  makeEntry(`root.field${i}`, i % 3 === 0 ? 'added' : i % 3 === 1 ? 'removed' : 'changed')
);

describe('sampleDiff', () => {
  it('returns all entries when pool is smaller than count', () => {
    const small = entries.slice(0, 5);
    expect(sampleDiff(small, { count: 10 })).toHaveLength(5);
  });

  it('returns exactly count entries when pool is larger', () => {
    expect(sampleDiff(entries, { count: 7 })).toHaveLength(7);
  });

  it('filters by changeType before sampling', () => {
    const result = sampleDiff(entries, { count: 100, changeType: 'added' });
    expect(result.every((e) => e.change === 'added')).toBe(true);
  });

  it('produces deterministic results with the same seed', () => {
    const a = sampleDiff(entries, { count: 5, seed: 42 });
    const b = sampleDiff(entries, { count: 5, seed: 42 });
    expect(a.map((e) => e.path)).toEqual(b.map((e) => e.path));
  });

  it('produces different results with different seeds', () => {
    const a = sampleDiff(entries, { count: 5, seed: 1 });
    const b = sampleDiff(entries, { count: 5, seed: 99 });
    // Very unlikely to be identical across 20 entries
    expect(a.map((e) => e.path)).not.toEqual(b.map((e) => e.path));
  });

  it('returns unique entries (no duplicates)', () => {
    const result = sampleDiff(entries, { count: 10, seed: 7 });
    const paths = result.map((e) => e.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('formatSampleReport', () => {
  it('includes sample count and total', () => {
    const sample = entries.slice(0, 3);
    const report = formatSampleReport(sample, entries.length);
    expect(report).toContain('Sample: 3 of 20');
  });

  it('marks added entries with +', () => {
    const sample = [makeEntry('a.b', 'added')];
    expect(formatSampleReport(sample, 1)).toContain('[+]');
  });

  it('marks removed entries with -', () => {
    const sample = [makeEntry('a.b', 'removed')];
    expect(formatSampleReport(sample, 1)).toContain('[-]');
  });

  it('marks changed entries with ~', () => {
    const sample = [makeEntry('a.b', 'changed')];
    expect(formatSampleReport(sample, 1)).toContain('[~]');
  });
});
