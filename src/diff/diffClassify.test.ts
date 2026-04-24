import {
  classifyEntry,
  classifyDiff,
  groupByClass,
  formatClassifyReport,
} from './diffClassify';
import { DiffEntry } from './shapeDiff';

const makeEntry = (
  path: string,
  change: DiffEntry['change'],
  from?: string,
  to?: string
): DiffEntry => ({ path, change, from, to });

describe('classifyEntry', () => {
  it('classifies added entries', () => {
    expect(classifyEntry(makeEntry('a.b', 'added'))).toBe('addition');
  });

  it('classifies removed entries', () => {
    expect(classifyEntry(makeEntry('a.b', 'removed'))).toBe('removal');
  });

  it('classifies type-change when both are primitives', () => {
    expect(classifyEntry(makeEntry('a.b', 'changed', 'string', 'number'))).toBe(
      'type-change'
    );
  });

  it('classifies structural when one side is non-primitive', () => {
    expect(classifyEntry(makeEntry('a.b', 'changed', 'object', 'string'))).toBe(
      'structural'
    );
  });

  it('returns unknown for unrecognised change', () => {
    expect(classifyEntry(makeEntry('a.b', 'changed', 'string', 'string'))).toBe(
      'unknown'
    );
  });
});

describe('classifyDiff', () => {
  it('attaches changeClass to every entry', () => {
    const entries: DiffEntry[] = [
      makeEntry('x', 'added'),
      makeEntry('y', 'removed'),
    ];
    const result = classifyDiff(entries);
    expect(result[0].changeClass).toBe('addition');
    expect(result[1].changeClass).toBe('removal');
  });
});

describe('groupByClass', () => {
  it('groups entries by their class', () => {
    const classified = classifyDiff([
      makeEntry('a', 'added'),
      makeEntry('b', 'added'),
      makeEntry('c', 'removed'),
    ]);
    const groups = groupByClass(classified);
    expect(groups.addition).toHaveLength(2);
    expect(groups.removal).toHaveLength(1);
    expect(groups['type-change']).toHaveLength(0);
  });
});

describe('formatClassifyReport', () => {
  it('renders a report with counts', () => {
    const classified = classifyDiff([
      makeEntry('data.id', 'added'),
      makeEntry('data.name', 'removed'),
    ]);
    const groups = groupByClass(classified);
    const report = formatClassifyReport(groups);
    expect(report).toContain('ADDITION');
    expect(report).toContain('REMOVAL');
    expect(report).toContain('data.id');
    expect(report).toContain('data.name');
  });

  it('omits empty classes', () => {
    const classified = classifyDiff([makeEntry('x', 'added')]);
    const groups = groupByClass(classified);
    const report = formatClassifyReport(groups);
    expect(report).not.toContain('REMOVAL');
  });
});
