import { correlateDiff, formatCorrelateReport } from './diffCorrelate';
import type { DiffEntry } from './diffFilter';

function makeEntry(path: string, change: DiffEntry['change'] = 'removed'): DiffEntry {
  return { path, change, left: 'string', right: undefined };
}

const groupA: DiffEntry[] = [makeEntry('a.x'), makeEntry('a.y'), makeEntry('b.z')];
const groupB: DiffEntry[] = [makeEntry('a.x'), makeEntry('a.y'), makeEntry('c.w')];
const groupC: DiffEntry[] = [makeEntry('a.x'), makeEntry('b.z')];
const groupD: DiffEntry[] = [makeEntry('c.w')];

describe('correlateDiff', () => {
  it('returns empty pairs when no paths co-occur enough', () => {
    const result = correlateDiff([[makeEntry('p1')], [makeEntry('p2')]], 0.5, 2);
    expect(result.pairs).toHaveLength(0);
  });

  it('detects strongly correlated pair', () => {
    const result = correlateDiff([groupA, groupB, groupC], 0.4, 2);
    const pair = result.pairs.find(p =>
      (p.pathA === 'a.x' && p.pathB === 'a.y') ||
      (p.pathA === 'a.y' && p.pathB === 'a.x')
    );
    expect(pair).toBeDefined();
    expect(pair!.coOccurrences).toBe(2);
    expect(pair!.correlation).toBeGreaterThanOrEqual(0.4);
  });

  it('respects minCoOccurrences threshold', () => {
    const result = correlateDiff([groupA, groupB], 0.0, 3);
    expect(result.pairs).toHaveLength(0);
  });

  it('respects minCorrelation threshold', () => {
    const result = correlateDiff([groupA, groupB, groupC], 0.99, 1);
    expect(result.pairs).toHaveLength(0);
  });

  it('reports totalPaths correctly', () => {
    const result = correlateDiff([groupA, groupB, groupC, groupD], 0.0, 1);
    // paths: a.x, a.y, b.z, c.w
    expect(result.totalPaths).toBe(4);
  });

  it('sorts pairs by correlation descending', () => {
    const result = correlateDiff([groupA, groupB, groupC], 0.0, 1);
    for (let i = 1; i < result.pairs.length; i++) {
      expect(result.pairs[i - 1].correlation).toBeGreaterThanOrEqual(result.pairs[i].correlation);
    }
  });
});

describe('formatCorrelateReport', () => {
  it('shows no-pairs message when empty', () => {
    const out = formatCorrelateReport({ pairs: [], totalPaths: 5 });
    expect(out).toContain('No correlated paths');
    expect(out).toContain('5 total paths');
  });

  it('formats pairs with percentage and co-occurrence count', () => {
    const out = formatCorrelateReport({
      pairs: [{ pathA: 'a.x', pathB: 'a.y', coOccurrences: 3, correlation: 0.75 }],
      totalPaths: 10,
    });
    expect(out).toContain('a.x');
    expect(out).toContain('a.y');
    expect(out).toContain('75.0%');
    expect(out).toContain('3 co-occurrences');
  });
});
