import { detectSentinels, formatSentinelReport, SentinelMatch } from './diffSentinel';
import type { DiffEntry } from './shapeDiff';

function makeEntry(path: string, leftValue?: unknown, rightValue?: unknown): DiffEntry & { leftValue?: unknown; rightValue?: unknown } {
  return { path, change: 'changed', leftType: 'string', rightType: 'string', leftValue, rightValue } as any;
}

describe('detectSentinels', () => {
  it('returns empty array when no sentinels present', () => {
    const entries = [makeEntry('a.b', 'hello', 'world')];
    expect(detectSentinels(entries)).toEqual([]);
  });

  it('detects null on both sides', () => {
    const entries = [makeEntry('a.b', null, null)];
    const result = detectSentinels(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ path: 'a.b', side: 'both', kind: 'null' });
  });

  it('detects empty-string on left only', () => {
    const entries = [makeEntry('x.y', '', 'real')];
    const result = detectSentinels(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ path: 'x.y', side: 'left', kind: 'empty-string' });
  });

  it('detects zero on right only', () => {
    const entries = [makeEntry('count', 5, 0)];
    const result = detectSentinels(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ path: 'count', side: 'right', kind: 'zero' });
  });

  it('detects empty-array on both sides', () => {
    const entries = [makeEntry('items', [], [])];
    const result = detectSentinels(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ side: 'both', kind: 'empty-array' });
  });

  it('detects empty-object on both sides', () => {
    const entries = [makeEntry('meta', {}, {})];
    const result = detectSentinels(entries);
    expect(result[0]).toMatchObject({ kind: 'empty-object', side: 'both' });
  });

  it('handles multiple entries independently', () => {
    const entries = [
      makeEntry('a', null, 'ok'),
      makeEntry('b', 'fine', ''),
    ];
    const result = detectSentinels(entries);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ path: 'a', side: 'left',  kind: 'null' });
    expect(result[1]).toMatchObject({ path: 'b', side: 'right', kind: 'empty-string' });
  });
});

describe('formatSentinelReport', () => {
  it('returns a no-sentinel message when list is empty', () => {
    expect(formatSentinelReport([])).toBe('No sentinel values detected.');
  });

  it('includes path, side and kind in output', () => {
    const matches: SentinelMatch[] = [{ path: 'foo.bar', side: 'both', kind: 'null' }];
    const report = formatSentinelReport(matches);
    expect(report).toContain('foo.bar');
    expect(report).toContain('both');
    expect(report).toContain('null');
    expect(report).toContain('Total: 1 sentinel(s) found.');
  });
});
