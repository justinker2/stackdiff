import { checkBudget, formatBudgetReport } from './diffBudget';
import type { DiffEntry } from './diffFilter';

function makeEntry(path: string, change: 'added' | 'removed' | 'changed'): DiffEntry {
  return { path, change, left: 'string', right: 'string' };
}

describe('checkBudget', () => {
  const entries: DiffEntry[] = [
    makeEntry('a.x', 'added'),
    makeEntry('a.y', 'added'),
    makeEntry('b.z', 'removed'),
    makeEntry('c.w', 'changed'),
  ];

  it('passes when all counts are within budget', () => {
    const result = checkBudget(entries, { maxAdded: 5, maxRemoved: 2, maxTotal: 10 });
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('fails when added exceeds budget', () => {
    const result = checkBudget(entries, { maxAdded: 1 });
    expect(result.passed).toBe(false);
    expect(result.violations).toContain('added (2) exceeds budget of 1');
  });

  it('fails when removed exceeds budget', () => {
    const result = checkBudget(entries, { maxRemoved: 0 });
    expect(result.passed).toBe(false);
    expect(result.violations[0]).toMatch(/removed/);
  });

  it('fails when changed exceeds budget', () => {
    const result = checkBudget(entries, { maxChanged: 0 });
    expect(result.passed).toBe(false);
    expect(result.violations[0]).toMatch(/changed/);
  });

  it('fails when total exceeds budget', () => {
    const result = checkBudget(entries, { maxTotal: 3 });
    expect(result.passed).toBe(false);
    expect(result.violations[0]).toMatch(/total/);
  });

  it('counts correctly', () => {
    const result = checkBudget(entries, {});
    expect(result.counts).toEqual({ added: 2, removed: 1, changed: 1, total: 4 });
  });

  it('passes with empty entries and no rules', () => {
    const result = checkBudget([], {});
    expect(result.passed).toBe(true);
    expect(result.counts.total).toBe(0);
  });
});

describe('formatBudgetReport', () => {
  it('shows PASSED when no violations', () => {
    const result = checkBudget([], { maxTotal: 10 });
    const report = formatBudgetReport(result);
    expect(report).toContain('✅ PASSED');
  });

  it('shows FAILED and lists violations', () => {
    const entries = [makeEntry('x', 'added'), makeEntry('y', 'added')];
    const result = checkBudget(entries, { maxAdded: 1 });
    const report = formatBudgetReport(result);
    expect(report).toContain('❌ FAILED');
    expect(report).toContain('added (2) exceeds budget of 1');
  });
});
