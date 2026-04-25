import { detectProbes, formatProbeReport } from './diffProbe';
import type { DiffEntry } from './shapeDiff';

function makeEntry(
  path: string,
  change: 'added' | 'removed' | 'changed' | 'unchanged'
): DiffEntry {
  return { path, change, sourceType: 'string', targetType: 'string' };
}

describe('detectProbes', () => {
  const entries: DiffEntry[] = [
    makeEntry('user.debugToken', 'added'),
    makeEntry('user.name', 'unchanged'),
    makeEntry('user.legacyId', 'removed'),
    makeEntry('meta.trace', 'added'),
    makeEntry('user.age', 'changed'),
  ];

  it('returns added and removed entries by default', () => {
    const result = detectProbes(entries);
    expect(result.total).toBe(3);
    expect(result.probes.map((p) => p.path)).toEqual([
      'user.debugToken',
      'user.legacyId',
      'meta.trace',
    ]);
  });

  it('filters by kind: only added', () => {
    const result = detectProbes(entries, { kinds: ['added'] });
    expect(result.total).toBe(2);
    result.probes.forEach((p) => expect(p.kind).toBe('added'));
  });

  it('filters by kind: only removed', () => {
    const result = detectProbes(entries, { kinds: ['removed'] });
    expect(result.total).toBe(1);
    expect(result.probes[0].path).toBe('user.legacyId');
  });

  it('respects maxDepth', () => {
    const deep: DiffEntry[] = [
      makeEntry('a.b.c.d', 'added'),
      makeEntry('a.b', 'added'),
    ];
    const result = detectProbes(deep, { maxDepth: 2 });
    expect(result.total).toBe(1);
    expect(result.probes[0].path).toBe('a.b');
  });

  it('sets correct depth on each probe', () => {
    const result = detectProbes(entries);
    const trace = result.probes.find((p) => p.path === 'meta.trace')!;
    expect(trace.depth).toBe(2);
  });

  it('returns total 0 when no added/removed entries', () => {
    const stable = [makeEntry('x', 'unchanged'), makeEntry('y', 'changed')];
    const result = detectProbes(stable);
    expect(result.total).toBe(0);
    expect(result.probes).toHaveLength(0);
  });
});

describe('formatProbeReport', () => {
  it('returns a no-probe message when empty', () => {
    const out = formatProbeReport({ probes: [], total: 0 });
    expect(out).toBe('No probe fields detected.');
  });

  it('includes total count and each path in output', () => {
    const result = detectProbes([
      makeEntry('user.debugToken', 'added'),
      makeEntry('user.legacyId', 'removed'),
    ]);
    const out = formatProbeReport(result);
    expect(out).toContain('Probe fields detected: 2');
    expect(out).toContain('[+] user.debugToken');
    expect(out).toContain('[-] user.legacyId');
  });
});
