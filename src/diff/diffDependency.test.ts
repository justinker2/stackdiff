import { detectDependencies, formatDependencyReport } from './diffDependency';
import type { DiffEntry } from './diffFilter';

function makeEntry(path: string, change: 'added' | 'removed' | 'changed'): DiffEntry {
  return { path, change, before: null, after: null };
}

describe('detectDependencies', () => {
  it('detects fields added together under same parent', () => {
    const entries = [
      makeEntry('user.name', 'added'),
      makeEntry('user.email', 'added'),
    ];
    const report = detectDependencies(entries);
    expect(report.pairs).toHaveLength(1);
    expect(report.pairs[0].type).toBe('added-together');
    expect(report.pairs[0].source).toBe('user.email');
    expect(report.pairs[0].target).toBe('user.name');
  });

  it('detects fields removed together under same parent', () => {
    const entries = [
      makeEntry('meta.version', 'removed'),
      makeEntry('meta.hash', 'removed'),
    ];
    const report = detectDependencies(entries);
    expect(report.pairs).toHaveLength(1);
    expect(report.pairs[0].type).toBe('removed-together');
  });

  it('detects inverse relationship when path appears in both added and removed', () => {
    const entries = [
      makeEntry('status', 'added'),
      makeEntry('status', 'removed'),
    ];
    const report = detectDependencies(entries);
    const inv = report.pairs.find(p => p.type === 'inverse');
    expect(inv).toBeDefined();
    expect(inv?.source).toBe('status');
  });

  it('returns orphans for unpaired fields', () => {
    const entries = [makeEntry('lone.field', 'added')];
    const report = detectDependencies(entries);
    expect(report.orphans).toContain('lone.field');
  });

  it('returns empty report for no entries', () => {
    const report = detectDependencies([]);
    expect(report.pairs).toHaveLength(0);
    expect(report.orphans).toHaveLength(0);
  });
});

describe('formatDependencyReport', () => {
  it('shows no dependencies message when pairs is empty', () => {
    const out = formatDependencyReport({ pairs: [], orphans: [] });
    expect(out).toContain('No dependencies detected.');
  });

  it('lists pairs and orphans', () => {
    const out = formatDependencyReport({
      pairs: [{ source: 'a.x', target: 'a.y', type: 'added-together' }],
      orphans: ['b.z'],
    });
    expect(out).toContain('[added-together]');
    expect(out).toContain('a.x <-> a.y');
    expect(out).toContain('b.z');
  });
});
