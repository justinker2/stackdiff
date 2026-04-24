import { detectKind, detectSentinels, formatSentinelReport } from './diffSentinel';
import type { DiffEntry } from './shapeDiff';

function makeEntry(path: string, change: DiffEntry['change'], a?: string, b?: string): DiffEntry {
  return { path, change, typeA: a ?? null, typeB: b ?? null };
}

describe('detectKind', () => {
  it('returns null-like for null type', () => {
    expect(detectKind('null')).toBe('null-like');
  });

  it('returns null-like for undefined type', () => {
    expect(detectKind('undefined')).toBe('null-like');
  });

  it('returns numeric for number type', () => {
    expect(detectKind('number')).toBe('numeric');
  });

  it('returns textual for string type', () => {
    expect(detectKind('string')).toBe('textual');
  });

  it('returns boolean for boolean type', () => {
    expect(detectKind('boolean')).toBe('boolean');
  });

  it('returns object for object type', () => {
    expect(detectKind('object')).toBe('object');
  });

  it('returns array for array type', () => {
    expect(detectKind('array')).toBe('array');
  });

  it('returns unknown for unrecognised type', () => {
    expect(detectKind('symbol')).toBe('unknown');
  });

  it('returns unknown for empty string', () => {
    expect(detectKind('')).toBe('unknown');
  });
});

describe('detectSentinels', () => {
  it('flags added null-like fields', () => {
    const entries: DiffEntry[] = [
      makeEntry('data.token', 'added', undefined, 'null'),
    ];
    const result = detectSentinels(entries);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('data.token');
    expect(result[0].kind).toBe('null-like');
    expect(result[0].change).toBe('added');
  });

  it('flags removed numeric fields', () => {
    const entries: DiffEntry[] = [
      makeEntry('stats.count', 'removed', 'number', undefined),
    ];
    const result = detectSentinels(entries);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('numeric');
  });

  it('ignores unchanged entries', () => {
    const entries: DiffEntry[] = [
      makeEntry('user.id', 'unchanged', 'number', 'number'),
    ];
    const result = detectSentinels(entries);
    expect(result).toHaveLength(0);
  });

  it('handles multiple sentinel entries', () => {
    const entries: DiffEntry[] = [
      makeEntry('a', 'added', undefined, 'null'),
      makeEntry('b', 'removed', 'boolean', undefined),
      makeEntry('c', 'changed', 'string', 'number'),
      makeEntry('d', 'unchanged', 'string', 'string'),
    ];
    const result = detectSentinels(entries);
    expect(result).toHaveLength(3);
  });

  it('returns empty array for empty input', () => {
    expect(detectSentinels([])).toEqual([]);
  });
});

describe('formatSentinelReport', () => {
  it('returns a no-sentinels message for empty list', () => {
    const out = formatSentinelReport([]);
    expect(out).toContain('No sentinel');
  });

  it('includes path and kind in output', () => {
    const entries: DiffEntry[] = [
      makeEntry('data.flag', 'added', undefined, 'boolean'),
    ];
    const sentinels = detectSentinels(entries);
    const out = formatSentinelReport(sentinels);
    expect(out).toContain('data.flag');
    expect(out).toContain('boolean');
  });

  it('includes change type in output', () => {
    const entries: DiffEntry[] = [
      makeEntry('meta.cursor', 'removed', 'string', undefined),
    ];
    const sentinels = detectSentinels(entries);
    const out = formatSentinelReport(sentinels);
    expect(out).toContain('removed');
  });
});
