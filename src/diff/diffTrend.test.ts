import { buildTrendPoint, computeTrend, formatTrendReport } from './diffTrend';
import * as diffHistory from './diffHistory';
import type { DiffEntry } from './diffHistory';

function makeEntry(timestamp: string, changes: Array<{ change: string }>): DiffEntry {
  return {
    timestamp,
    urlA: 'http://a.test',
    urlB: 'http://b.test',
    results: changes as any,
  };
}

describe('buildTrendPoint', () => {
  it('counts changes by type', () => {
    const entry = makeEntry('2024-01-01T00:00:00Z', [
      { change: 'added' },
      { change: 'added' },
      { change: 'removed' },
      { change: 'changed' },
    ]);
    const point = buildTrendPoint(entry);
    expect(point.added).toBe(2);
    expect(point.removed).toBe(1);
    expect(point.changed).toBe(1);
    expect(point.total).toBe(4);
    expect(point.timestamp).toBe('2024-01-01T00:00:00Z');
  });

  it('returns zeros for empty results', () => {
    const entry = makeEntry('2024-01-02T00:00:00Z', []);
    const point = buildTrendPoint(entry);
    expect(point.total).toBe(0);
  });
});

describe('computeTrend', () => {
  beforeEach(() => {
    jest.spyOn(diffHistory, 'loadHistory').mockReturnValue([
      makeEntry('2024-01-01T00:00:00Z', [{ change: 'added' }, { change: 'added' }]),
      makeEntry('2024-01-02T00:00:00Z', [{ change: 'added' }]),
    ]);
  });

  afterEach(() => jest.restoreAllMocks());

  it('detects improving trend when total decreases', () => {
    const report = computeTrend();
    expect(report.direction).toBe('improving');
    expect(report.deltaAdded).toBe(-1);
    expect(report.points).toHaveLength(2);
  });

  it('returns stable when only one history entry', () => {
    (diffHistory.loadHistory as jest.Mock).mockReturnValue([
      makeEntry('2024-01-01T00:00:00Z', [{ change: 'added' }]),
    ]);
    const report = computeTrend();
    expect(report.direction).toBe('stable');
  });
});

describe('formatTrendReport', () => {
  it('includes direction and delta line', () => {
    const report = {
      points: [],
      direction: 'degrading' as const,
      deltaAdded: 3,
      deltaRemoved: -1,
      deltaChanged: 0,
    };
    const text = formatTrendReport(report);
    expect(text).toContain('degrading');
    expect(text).toContain('+3');
    expect(text).toContain('-1');
  });
});
