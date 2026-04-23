import { highlightDiff, formatHighlightReport, patternToRegex } from './diffHighlight';
import type { DiffEntry } from './shapeDiff';

const makeEntry = (path: string, change: DiffEntry['change'] = 'added'): DiffEntry => ({
  path,
  change,
  leftType: null,
  rightType: 'string',
});

describe('patternToRegex', () => {
  it('matches exact paths', () => {
    expect(patternToRegex('user.name').test('user.name')).toBe(true);
    expect(patternToRegex('user.name').test('user.age')).toBe(false);
  });

  it('matches single wildcard', () => {
    const re = patternToRegex('user.*');
    expect(re.test('user.name')).toBe(true);
    expect(re.test('user.address.city')).toBe(false);
  });

  it('matches double wildcard', () => {
    const re = patternToRegex('user.**');
    expect(re.test('user.address.city')).toBe(true);
    expect(re.test('order.id')).toBe(false);
  });
});

describe('highlightDiff', () => {
  const entries = [
    makeEntry('user.name'),
    makeEntry('user.email'),
    makeEntry('order.total', 'removed'),
    makeEntry('meta.version', 'changed'),
  ];

  it('attaches highlight to matched entries', () => {
    const result = highlightDiff(entries, [{ pattern: 'user.*', label: 'PII' }]);
    expect(result[0].highlight).toEqual({ label: 'PII', note: undefined });
    expect(result[1].highlight).toEqual({ label: 'PII', note: undefined });
    expect(result[2].highlight).toBeUndefined();
  });

  it('attaches note when provided', () => {
    const result = highlightDiff(entries, [
      { pattern: 'meta.version', label: 'BREAKING', note: 'version bump' },
    ]);
    expect(result[3].highlight).toEqual({ label: 'BREAKING', note: 'version bump' });
  });

  it('returns unmodified entries when no rules match', () => {
    const result = highlightDiff(entries, [{ pattern: 'foo.bar', label: 'X' }]);
    result.forEach((e) => expect(e.highlight).toBeUndefined());
  });
});

describe('formatHighlightReport', () => {
  it('returns message when nothing highlighted', () => {
    const result = formatHighlightReport([makeEntry('a.b')]);
    expect(result).toBe('No highlighted fields.');
  });

  it('formats highlighted entries', () => {
    const entries = highlightDiff(
      [makeEntry('user.email'), makeEntry('order.id', 'removed')],
      [{ pattern: 'user.email', label: 'PII', note: 'sensitive' }]
    );
    const report = formatHighlightReport(entries);
    expect(report).toContain('[PII]');
    expect(report).toContain('user.email');
    expect(report).toContain('sensitive');
    expect(report).not.toContain('order.id');
  });
});
