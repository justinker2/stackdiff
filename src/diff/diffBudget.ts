import type { DiffEntry } from './diffFilter';

export interface BudgetRule {
  maxAdded?: number;
  maxRemoved?: number;
  maxChanged?: number;
  maxTotal?: number;
}

export interface BudgetResult {
  passed: boolean;
  violations: string[];
  counts: {
    added: number;
    removed: number;
    changed: number;
    total: number;
  };
}

export function checkBudget(entries: DiffEntry[], rule: BudgetRule): BudgetResult {
  const counts = {
    added: 0,
    removed: 0,
    changed: 0,
    total: entries.length,
  };

  for (const entry of entries) {
    if (entry.change === 'added') counts.added++;
    else if (entry.change === 'removed') counts.removed++;
    else if (entry.change === 'changed') counts.changed++;
  }

  const violations: string[] = [];

  if (rule.maxAdded !== undefined && counts.added > rule.maxAdded) {
    violations.push(`added (${counts.added}) exceeds budget of ${rule.maxAdded}`);
  }
  if (rule.maxRemoved !== undefined && counts.removed > rule.maxRemoved) {
    violations.push(`removed (${counts.removed}) exceeds budget of ${rule.maxRemoved}`);
  }
  if (rule.maxChanged !== undefined && counts.changed > rule.maxChanged) {
    violations.push(`changed (${counts.changed}) exceeds budget of ${rule.maxChanged}`);
  }
  if (rule.maxTotal !== undefined && counts.total > rule.maxTotal) {
    violations.push(`total (${counts.total}) exceeds budget of ${rule.maxTotal}`);
  }

  return { passed: violations.length === 0, violations, counts };
}

export function formatBudgetReport(result: BudgetResult): string {
  const lines: string[] = [];
  const { added, removed, changed, total } = result.counts;
  lines.push(`Budget Check: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push(`  added: ${added}  removed: ${removed}  changed: ${changed}  total: ${total}`);
  if (result.violations.length > 0) {
    lines.push('Violations:');
    for (const v of result.violations) {
      lines.push(`  - ${v}`);
    }
  }
  return lines.join('\n');
}
