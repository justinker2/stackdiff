import { cohortDiff, buildFrequencyMap, formatCohortReport } from './diffCohort';
import type { DiffEntry } from './diffFilter';

function makeEntry(path: string, change: DiffEntry['change'] = 'added'): DiffEntry {
  return { path, change, left: null, right: 'string' };
}

describe('buildFrequencyMap', () => {
  it('counts occurrences of each path', () => {
    const entries = [makeEntry('a'), makeEntry('a'), makeEntry('b')];
    const freq = buildFrequencyMap(entries);
    expect(freq.get('a')).toBe(2);
    expect(freq.get('b')).toBe(1);
  });

  it('returns empty map for empty input', () => {
    expect(buildFrequencyMap([]).size).toBe(0);
  });
});

describe('cohortDiff', () => {
  it('places single-occurrence entries in rare bucket', () => {
    const entries = [makeEntry('x')];
    const report = cohortDiff(entries);
    expect(report.buckets[0].label).toBe('rare');
    expect(report.buckets[0].entries).toHaveLength(1);
  });

  it('places high-frequency entries in frequent bucket', () => {
    const entries = Array.from({ length: 25 }, () => makeEntry('hot'));
    const report = cohortDiff(entries);
    const frequent = report.buckets.find(b => b.label === 'frequent');
    expect(frequent).toBeDefined();
    expect(frequent!.entries.length).toBe(25);
  });

  it('omits empty buckets', () => {
    const entries = [makeEntry('a'), makeEntry('b')];
    const report = cohortDiff(entries);
    expect(report.buckets.every(b => b.entries.length > 0)).toBe(true);
  });

  it('totals all entries', () => {
    const entries = [makeEntry('a'), makeEntry('a'), makeEntry('b')];
    expect(cohortDiff(entries).total).toBe(3);
  });
});

describe('formatCohortReport', () => {
  it('returns no-entry message for empty input', () => {
    expect(formatCohortReport({ buckets: [], total: 0 })).toMatch(/No entries/);
  });

  it('includes bucket label and percentage', () => {
    const entries = [makeEntry('p')];
    const report = cohortDiff(entries);
    const text = formatCohortReport(report);
    expect(text).toContain('[rare]');
    expect(text).toContain('100.0%');
  });

  it('shows ellipsis when more than 3 unique paths', () => {
    const entries = ['a', 'b', 'c', 'd'].map(p => makeEntry(p));
    const report = cohortDiff(entries);
    const text = formatCohortReport(report);
    expect(text).toContain('...');
  });
});
