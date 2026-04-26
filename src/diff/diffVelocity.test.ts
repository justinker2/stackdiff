import { computeVelocity, formatVelocityReport } from './diffVelocity';
import { DiffEntry } from './diffHistory';

function makeEntry(change: 'added' | 'removed' | 'changed', path = 'a.b'): DiffEntry {
  return { path, change, left: 'string', right: 'string' };
}

const t1 = 1_000_000;
const t2 = 2_000_000;
const t3 = 3_000_000;

describe('computeVelocity', () => {
  it('returns empty report for no snapshots', () => {
    const r = computeVelocity([]);
    expect(r.points).toHaveLength(0);
    expect(r.avgAdded).toBe(0);
    expect(r.peakTotal).toBe(0);
  });

  it('counts changes per snapshot correctly', () => {
    const r = computeVelocity([
      { timestamp: t1, entries: [makeEntry('added'), makeEntry('added'), makeEntry('removed')] },
      { timestamp: t2, entries: [makeEntry('changed')] },
    ]);
    expect(r.points[0]).toMatchObject({ added: 2, removed: 1, changed: 0, total: 3 });
    expect(r.points[1]).toMatchObject({ added: 0, removed: 0, changed: 1, total: 1 });
  });

  it('sorts points by timestamp ascending', () => {
    const r = computeVelocity([
      { timestamp: t3, entries: [] },
      { timestamp: t1, entries: [] },
      { timestamp: t2, entries: [] },
    ]);
    expect(r.points.map(p => p.timestamp)).toEqual([t1, t2, t3]);
  });

  it('computes averages across snapshots', () => {
    const r = computeVelocity([
      { timestamp: t1, entries: [makeEntry('added'), makeEntry('added')] },
      { timestamp: t2, entries: [makeEntry('added')] },
    ]);
    expect(r.avgAdded).toBe(1.5);
  });

  it('identifies peak snapshot', () => {
    const r = computeVelocity([
      { timestamp: t1, entries: [makeEntry('added')] },
      { timestamp: t2, entries: [makeEntry('added'), makeEntry('removed'), makeEntry('changed')] },
    ]);
    expect(r.peakTimestamp).toBe(t2);
    expect(r.peakTotal).toBe(3);
  });
});

describe('formatVelocityReport', () => {
  it('shows no-data message when empty', () => {
    const out = formatVelocityReport(computeVelocity([]));
    expect(out).toContain('No data points.');
  });

  it('includes summary lines and timeline', () => {
    const r = computeVelocity([
      { timestamp: t1, entries: [makeEntry('added'), makeEntry('removed')] },
    ]);
    const out = formatVelocityReport(r);
    expect(out).toContain('Velocity Report');
    expect(out).toContain('Timeline:');
    expect(out).toContain('+1 -1 ~0');
  });
});
