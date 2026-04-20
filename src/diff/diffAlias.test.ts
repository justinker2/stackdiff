import {
  matchAlias,
  aliasDiff,
  formatAliasReport,
  buildAliasIndex,
  AliasRule,
} from './diffAlias';

const rules: AliasRule[] = [
  { pattern: 'user.id', alias: 'User ID' },
  { pattern: 'user.*', alias: 'User Field' },
  { pattern: 'meta.*', alias: 'Metadata' },
];

describe('matchAlias', () => {
  it('returns alias for exact match', () => {
    expect(matchAlias('user.id', rules)).toBe('User ID');
  });

  it('returns alias for wildcard match', () => {
    expect(matchAlias('user.email', rules)).toBe('User Field');
  });

  it('returns undefined for no match', () => {
    expect(matchAlias('order.total', rules)).toBeUndefined();
  });

  it('matches first applicable rule', () => {
    // user.id matches both 'user.id' and 'user.*', first wins
    expect(matchAlias('user.id', rules)).toBe('User ID');
  });
});

describe('aliasDiff', () => {
  it('annotates entries with matching aliases', () => {
    const entries = [
      { path: 'user.id', change: 'type changed' },
      { path: 'order.total', change: 'added' },
    ];
    const result = aliasDiff(entries, rules);
    expect(result[0].alias).toBe('User ID');
    expect(result[1].alias).toBeUndefined();
  });
});

describe('formatAliasReport', () => {
  it('returns placeholder for empty entries', () => {
    expect(formatAliasReport([])).toBe('No diff entries.');
  });

  it('includes alias in output when present', () => {
    const entries = [{ path: 'user.id', change: 'type changed', alias: 'User ID' }];
    const report = formatAliasReport(entries);
    expect(report).toContain('user.id (User ID)');
    expect(report).toContain('type changed');
  });

  it('omits alias label when absent', () => {
    const entries = [{ path: 'order.total', change: 'added', alias: undefined }];
    const report = formatAliasReport(entries);
    expect(report).toContain('order.total: added');
    expect(report).not.toContain('(');
  });
});

describe('buildAliasIndex', () => {
  it('creates a map from pattern to alias', () => {
    const index = buildAliasIndex(rules);
    expect(index.get('user.id')).toBe('User ID');
    expect(index.size).toBe(3);
  });
});
