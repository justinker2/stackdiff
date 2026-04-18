import { lintDiff, formatLintResult, LintRule } from './diffLint';
import { DiffEntry } from './diffAnnotate';

const added: DiffEntry = { path: 'user.newField', type: 'added', severity: 'info' };
const removed: DiffEntry = { path: 'user.oldField', type: 'removed', severity: 'error' };
const changed: DiffEntry = { path: 'user.age', type: 'changed', severity: 'warning' };
const unchanged: DiffEntry = { path: 'user.id', type: 'unchanged', severity: 'info' };

describe('lintDiff', () => {
  it('reports violations for added, removed, changed entries', () => {
    const result = lintDiff([added, removed, changed, unchanged]);
    expect(result.failed).toBe(3);
    expect(result.passed).toBe(1);
  });

  it('returns no violations for unchanged entries', () => {
    const result = lintDiff([unchanged]);
    expect(result.violations).toHaveLength(0);
    expect(result.passed).toBe(1);
  });

  it('uses custom rules when provided', () => {
    const customRule: LintRule = {
      id: 'no-added',
      description: 'No additions allowed',
      check: (e) => e.type === 'added',
    };
    const result = lintDiff([added, removed], [customRule]);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].ruleId).toBe('no-added');
    expect(result.passed).toBe(1);
  });

  it('captures correct path and type in violation', () => {
    const result = lintDiff([removed]);
    const v = result.violations.find((x) => x.ruleId === 'no-removal');
    expect(v).toBeDefined();
    expect(v!.path).toBe('user.oldField');
    expect(v!.type).toBe('removed');
  });
});

describe('formatLintResult', () => {
  it('includes summary line', () => {
    const result = lintDiff([unchanged]);
    const out = formatLintResult(result);
    expect(out).toContain('1 passed');
    expect(out).toContain('0 failed');
  });

  it('lists violations with rule id and path', () => {
    const result = lintDiff([removed]);
    const out = formatLintResult(result);
    expect(out).toContain('[no-removal]');
    expect(out).toContain('user.oldField');
  });
});
