import { scoreDiff, formatScore, ScoreResult } from './diffScore';
import { DiffEntry } from './diffFilter';

function entry(key: string, change: DiffEntry['change']): DiffEntry {
  return { key, change, left: 'string', right: 'string' };
}

describe('scoreDiff', () => {
  it('returns score 1 for empty entries', () => {
    const result = scoreDiff([]);
    expect(result.score).toBe(1);
    expect(result.total).toBe(0);
  });

  it('returns score 1 when all unchanged', () => {
    const entries = [entry('a', 'unchanged'), entry('b', 'unchanged')];
    const result = scoreDiff(entries);
    expect(result.score).toBe(1);
    expect(result.unchanged).toBe(2);
  });

  it('returns score 0 when all removed', () => {
    const entries = [entry('a', 'removed'), entry('b', 'removed')];
    const result = scoreDiff(entries);
    expect(result.score).toBe(0);
    expect(result.removed).toBe(2);
  });

  it('computes mixed score correctly', () => {
    const entries = [
      entry('a', 'unchanged'),
      entry('b', 'unchanged'),
      entry('c', 'added'),
      entry('d', 'removed'),
    ];
    const result = scoreDiff(entries);
    expect(result.score).toBe(0.5);
    expect(result.added).toBe(1);
    expect(result.removed).toBe(1);
    expect(result.changed).toBe(0);
  });

  it('counts changed entries', () => {
    const entries = [entry('x', 'changed'), entry('y', 'unchanged')];
    const result = scoreDiff(entries);
    expect(result.changed).toBe(1);
    expect(result.score).toBe(0.5);
  });
});

describe('formatScore', () => {
  it('formats a score result as readable string', () => {
    const result: ScoreResult = { score: 0.75, total: 4, unchanged: 3, added: 1, removed: 0, changed: 0 };
    const output = formatScore(result);
    expect(output).toContain('75.0%');
    expect(output).toContain('Total fields : 4');
    expect(output).toContain('Unchanged    : 3');
    expect(output).toContain('Added        : 1');
  });
});
