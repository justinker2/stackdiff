import {
  stripArrayIndices,
  normalizePath,
  normalizeDiff,
  formatNormalizeSummary,
  DiffEntry,
} from './diffNormalize';

describe('stripArrayIndices', () => {
  it('replaces numeric indices with [*]', () => {
    expect(stripArrayIndices('items[0].name')).toBe('items[*].name');
    expect(stripArrayIndices('a[1][2].b')).toBe('a[*][*].b');
  });

  it('leaves non-numeric brackets alone', () => {
    expect(stripArrayIndices('items[*].name')).toBe('items[*].name');
  });

  it('returns unchanged string when no indices present', () => {
    expect(stripArrayIndices('foo.bar.baz')).toBe('foo.bar.baz');
  });
});

describe('normalizePath', () => {
  it('lowercases keys by default', () => {
    expect(normalizePath('Foo.Bar')).toBe('foo.bar');
  });

  it('strips array indices by default', () => {
    expect(normalizePath('items[3].id')).toBe('items[*].id');
  });

  it('trims whitespace by default', () => {
    expect(normalizePath('  foo.bar  ')).toBe('foo.bar');
  });

  it('respects opt-out flags', () => {
    expect(normalizePath('Foo[1]', { lowercaseKeys: false, stripArrayIndices: false })).toBe('Foo[1]');
  });
});

describe('normalizeDiff', () => {
  const makeEntry = (path: string, type = 'added'): DiffEntry => ({ path, type });

  it('normalizes paths in all entries', () => {
    const entries = [makeEntry('Items[0].Name'), makeEntry('Items[1].Name')];
    const result = normalizeDiff(entries);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('items[*].name');
  });

  it('deduplicates by normalized path + type', () => {
    const entries = [makeEntry('foo.bar', 'added'), makeEntry('FOO.BAR', 'added'), makeEntry('foo.bar', 'removed')];
    const result = normalizeDiff(entries);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(normalizeDiff([])).toEqual([]);
  });
});

describe('formatNormalizeSummary', () => {
  it('reports duplicates removed', () => {
    expect(formatNormalizeSummary(5, 3)).toContain('Removed 2 duplicates');
  });

  it('reports no duplicates when counts match', () => {
    expect(formatNormalizeSummary(3, 3)).toContain('No duplicates removed');
  });

  it('uses singular for one entry', () => {
    expect(formatNormalizeSummary(1, 1)).toContain('1 entry.');
  });
});
