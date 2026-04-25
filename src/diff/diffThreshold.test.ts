import { checkThreshold, formatThresholdReport, ThresholdOptions } from './diffThreshold';
import type { DiffEntry } from './diffFilter';

function makeEntry(change: 'added' | 'removed' | 'changed', path = 'a.b'): DiffEntry {
  return { path, change, fromType: 'string', toType: 'string' };
}

describe('checkThreshold', () => {
  it('returns passed when no options set', () => {
    const entries = [makeEntry('added'), makeEntry('removed')];
    const result = checkThreshold(entries, {});
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('counts entries by change type', () => {
    const entries = [
      makeEntry('added'),
      makeEntry('added'),
      makeEntry('removed'),
      makeEntry('changed'),
    ];
    const result = checkThreshold(entries, {});
    expect(result.added).toBe(2);
    expect(result.removed).toBe(1);
    expect(result.changed).toBe(1);
    expect(result.total).toBe(4);
  });

  it('fails when added exceeds maxAdded', () => {
    const entries = [makeEntry('added'), makeEntry('added'), makeEntry('added')];
    const result = checkThreshold(entries, { maxAdded: 2 });
    expect(result.passed).toBe(false);
    expect(result.violations).toContain('added 3 exceeds limit 2');
  });

  it('fails when removed exceeds maxRemoved', () => {
    const entries = [makeEntry('removed'), makeEntry('removed')];
    const result = checkThreshold(entries, { maxRemoved: 1 });
    expect(result.passed).toBe(false);
    expect(result.violations[0]).toMatch(/removed 2 exceeds limit 1/);
  });

  it('fails when changed exceeds maxChanged', () => {
    const entries = [makeEntry('changed')];
    const result = checkThreshold(entries, { maxChanged: 0 });
    expect(result.passed).toBe(false);
  });

  it('fails when total exceeds maxTotal', () => {
    const entries = [makeEntry('added'), makeEntry('removed'), makeEntry('changed')];
    const result = checkThreshold(entries, { maxTotal: 2 });
    expect(result.passed).toBe(false);
    expect(result.violations).toContain('total 3 exceeds limit 2');
  });

  it('can accumulate multiple violations', () => {
    const entries = [makeEntry('added'), makeEntry('added'), makeEntry('removed'), makeEntry('removed')];
    const result = checkThreshold(entries, { maxAdded: 1, maxRemoved: 1, maxTotal: 3 });
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
    expect(result.passed).toBe(false);
  });

  it('passes when counts equal limits exactly', () => {
    const entries = [makeEntry('added'), makeEntry('removed')];
    const result = checkThreshold(entries, { maxAdded: 1, maxRemoved: 1, maxTotal: 2 });
    expect(result.passed).toBe(true);
  });
});

describe('formatThresholdReport', () => {
  it('shows PASSED when no violations', () => {
    const result = checkThreshold([makeEntry('added')], { maxAdded: 5 });
    const report = formatThresholdReport(result);
    expect(report).toContain('PASSED');
    expect(report).toContain('Added   : 1');
  });

  it('shows FAILED and lists violations', () => {
    const entries = [makeEntry('removed'), makeEntry('removed'), makeEntry('removed')];
    const result = checkThreshold(entries, { maxRemoved: 2 });
    const report = formatThresholdReport(result);
    expect(report).toContain('FAILED');
    expect(report).toContain('removed 3 exceeds limit 2');
  });
});
