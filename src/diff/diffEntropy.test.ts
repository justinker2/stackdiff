import { computeEntropy, formatEntropyReport } from './diffEntropy';
import type { DiffEntry } from './shapeDiff';

function makeEntry(change: DiffEntry['change'], path = 'a.b'): DiffEntry {
  return { path, change, left: 'string', right: 'number' };
}

describe('computeEntropy', () => {
  it('returns zero entropy for empty input', () => {
    const result = computeEntropy([]);
    expect(result.total).toBe(0);
    expect(result.entropy).toBe(0);
    expect(result.normalized).toBe(0);
    expect(result.label).toBe('low');
  });

  it('returns zero entropy when all changes are the same type', () => {
    const entries = [makeEntry('added'), makeEntry('added'), makeEntry('added')];
    const result = computeEntropy(entries);
    expect(result.entropy).toBe(0);
    expect(result.normalized).toBe(0);
    expect(result.label).toBe('low');
    expect(result.counts).toEqual({ added: 3 });
  });

  it('returns maximum entropy for uniform distribution across two types', () => {
    const entries = [
      makeEntry('added'),
      makeEntry('removed'),
      makeEntry('added'),
      makeEntry('removed'),
    ];
    const result = computeEntropy(entries);
    // uniform over 2 → entropy = 1 bit, normalized = 1.0
    expect(result.entropy).toBe(1);
    expect(result.normalized).toBe(1);
    expect(result.label).toBe('high');
  });

  it('computes partial entropy for skewed distribution', () => {
    const entries = [
      makeEntry('added'),
      makeEntry('added'),
      makeEntry('added'),
      makeEntry('removed'),
    ];
    const result = computeEntropy(entries);
    expect(result.entropy).toBeGreaterThan(0);
    expect(result.entropy).toBeLessThan(1);
    expect(result.total).toBe(4);
  });

  it('labels moderate entropy correctly', () => {
    // 3 types, roughly 50/25/25 split → normalized around 0.5–0.7
    const entries = [
      makeEntry('added'), makeEntry('added'),
      makeEntry('removed'),
      makeEntry('changed'),
    ];
    const result = computeEntropy(entries);
    expect(['moderate', 'high']).toContain(result.label);
  });

  it('includes probabilities summing to 1', () => {
    const entries = [makeEntry('added'), makeEntry('removed'), makeEntry('changed')];
    const result = computeEntropy(entries);
    const sum = Object.values(result.probabilities).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 4);
  });
});

describe('formatEntropyReport', () => {
  it('produces a non-empty string with key labels', () => {
    const entries = [makeEntry('added'), makeEntry('removed')];
    const result = computeEntropy(entries);
    const report = formatEntropyReport(result);
    expect(report).toContain('Entropy Report');
    expect(report).toContain('Shannon entropy');
    expect(report).toContain('added');
    expect(report).toContain('removed');
  });

  it('handles empty result gracefully', () => {
    const result = computeEntropy([]);
    const report = formatEntropyReport(result);
    expect(report).toContain('Total entries : 0');
  });
});
