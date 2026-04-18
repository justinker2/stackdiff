import { mergeDiffs, formatMergeConflicts, MergeResult } from './diffMerge';
import { DiffEntry } from './diffFilter';

const makeEntry = (path: string, change: DiffEntry['change']): DiffEntry => ({
  path,
  change,
  baseType: 'string',
  incomingType: 'string',
});

describe('mergeDiffs', () => {
  it('merges disjoint sets with no conflicts', () => {
    const base = [makeEntry('a', 'added')];
    const incoming = [makeEntry('b', 'removed')];
    const result = mergeDiffs(base, incoming);
    expect(result.conflicts).toHaveLength(0);
    expect(result.merged).toHaveLength(2);
  });

  it('detects conflict when same path has different change', () => {
    const base = [makeEntry('x', 'added')];
    const incoming = [makeEntry('x', 'removed')];
    const result = mergeDiffs(base, incoming);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].path).toBe('x');
  });

  it('incoming wins for conflicting paths', () => {
    const base = [makeEntry('x', 'added')];
    const incoming = [makeEntry('x', 'removed')];
    const { merged } = mergeDiffs(base, incoming);
    const entry = merged.find((e) => e.path === 'x');
    expect(entry?.change).toBe('removed');
  });

  it('no conflict when same path same change', () => {
    const base = [makeEntry('y', 'typeChanged')];
    const incoming = [makeEntry('y', 'typeChanged')];
    const { conflicts } = mergeDiffs(base, incoming);
    expect(conflicts).toHaveLength(0);
  });
});

describe('formatMergeConflicts', () => {
  it('returns no-conflict message when empty', () => {
    expect(formatMergeConflicts([])).toBe('No conflicts.');
  });

  it('formats conflicts correctly', () => {
    const base = makeEntry('p', 'added');
    const incoming = makeEntry('p', 'removed');
    const out = formatMergeConflicts([{ path: 'p', base, incoming }]);
    expect(out).toContain('CONFLICT p');
    expect(out).toContain('base=added');
    expect(out).toContain('incoming=removed');
  });
});
