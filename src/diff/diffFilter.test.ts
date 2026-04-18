import { filterDiff, globToRegex, summariseDiff, DiffEntry } from './diffFilter';

const sampleEntries: DiffEntry[] = [
  { path: 'user.id', changeType: 'unchanged', left: 'number', right: 'number' },
  { path: 'user.name', changeType: 'changed', left: 'string', right: 'null' },
  { path: 'user.email', changeType: 'added', right: 'string' },
  { path: 'user.age', changeType: 'removed', left: 'number' },
  { path: 'meta.version', changeType: 'unchanged', left: 'string', right: 'string' },
];

describe('filterDiff', () => {
  it('returns all entries when no options provided', () => {
    expect(filterDiff(sampleEntries, {})).toHaveLength(5);
  });

  it('excludes unchanged entries when excludeUnchanged is true', () => {
    const result = filterDiff(sampleEntries, { excludeUnchanged: true });
    expect(result).toHaveLength(3);
    expect(result.every((e) => e.changeType !== 'unchanged')).toBe(true);
  });

  it('filters by single change type', () => {
    const result = filterDiff(sampleEntries, { types: ['added'] });
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('user.email');
  });

  it('filters by multiple change types', () => {
    const result = filterDiff(sampleEntries, { types: ['added', 'removed'] });
    expect(result).toHaveLength(2);
  });

  it('filters by path pattern', () => {
    const result = filterDiff(sampleEntries, { pathPattern: 'user.*' });
    expect(result).toHaveLength(4);
  });

  it('combines type and path filters', () => {
    const result = filterDiff(sampleEntries, { types: ['unchanged'], pathPattern: 'meta.*' });
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('meta.version');
  });
});

describe('globToRegex', () => {
  it('matches wildcard patterns', () => {
    const regex = globToRegex('user.*');
    expect(regex.test('user.id')).toBe(true);
    expect(regex.test('meta.version')).toBe(false);
  });

  it('matches single character with ?', () => {
    const regex = globToRegex('user.i?');
    expect(regex.test('user.id')).toBe(true);
    expect(regex.test('user.name')).toBe(false);
  });
});

describe('summariseDiff', () => {
  it('counts entries by change type', () => {
    const summary = summariseDiff(sampleEntries);
    expect(summary.unchanged).toBe(2);
    expect(summary.changed).toBe(1);
    expect(summary.added).toBe(1);
    expect(summary.removed).toBe(1);
  });

  it('returns zeros for empty input', () => {
    const summary = summariseDiff([]);
    expect(summary).toEqual({ added: 0, removed: 0, changed: 0, unchanged: 0 });
  });
});
