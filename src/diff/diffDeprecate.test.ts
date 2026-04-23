import {
  patternToRegex,
  findDeprecations,
  formatDeprecationReport,
  type DeprecationRule,
} from './diffDeprecate';
import type { DiffEntry } from './shapeDiff';

const makeEntry = (path: string, change: DiffEntry['change'] = 'unchanged'): DiffEntry => ({
  path,
  change,
  leftType: 'string',
  rightType: 'string',
});

describe('patternToRegex', () => {
  it('matches exact path', () => {
    expect(patternToRegex('user.email').test('user.email')).toBe(true);
  });

  it('matches wildcard suffix', () => {
    expect(patternToRegex('user.*').test('user.email')).toBe(true);
    expect(patternToRegex('user.*').test('user.name')).toBe(true);
    expect(patternToRegex('user.*').test('account.email')).toBe(false);
  });

  it('matches ? wildcard', () => {
    expect(patternToRegex('v?').test('v1')).toBe(true);
    expect(patternToRegex('v?').test('v12')).toBe(false);
  });
});

describe('findDeprecations', () => {
  const rules: DeprecationRule[] = [
    { pattern: 'user.legacy_id', reason: 'use user.id instead' },
    { pattern: 'meta.*' },
  ];

  it('flags matching unchanged entries', () => {
    const entries = [makeEntry('user.legacy_id'), makeEntry('user.id')];
    const results = findDeprecations(entries, rules);
    expect(results).toHaveLength(1);
    expect(results[0].entry.path).toBe('user.legacy_id');
    expect(results[0].message).toContain('use user.id instead');
  });

  it('flags matching added entries', () => {
    const entries = [makeEntry('meta.debug', 'added')];
    const results = findDeprecations(entries, rules);
    expect(results).toHaveLength(1);
  });

  it('ignores removed entries', () => {
    const entries = [makeEntry('user.legacy_id', 'removed')];
    const results = findDeprecations(entries, rules);
    expect(results).toHaveLength(0);
  });

  it('returns empty when no rules match', () => {
    const entries = [makeEntry('user.email')];
    expect(findDeprecations(entries, rules)).toHaveLength(0);
  });
});

describe('formatDeprecationReport', () => {
  it('returns summary when no results', () => {
    expect(formatDeprecationReport([])).toBe('No deprecated fields found.');
  });

  it('lists deprecated fields', () => {
    const rule: DeprecationRule = { pattern: 'user.legacy_id' };
    const entry = makeEntry('user.legacy_id');
    const report = formatDeprecationReport([{ entry, rule, message: 'Deprecated field "user.legacy_id"' }]);
    expect(report).toContain('Deprecated fields (1)');
    expect(report).toContain('user.legacy_id');
  });
});
