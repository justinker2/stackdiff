/**
 * diffThreshold.ts
 * Filter and report diff entries that exceed configurable change thresholds.
 */

import type { DiffEntry } from './diffFilter';

export interface ThresholdOptions {
  /** Maximum allowed added fields (inclusive). Undefined = no limit. */
  maxAdded?: number;
  /** Maximum allowed removed fields (inclusive). Undefined = no limit. */
  maxRemoved?: number;
  /** Maximum allowed changed fields (inclusive). Undefined = no limit. */
  maxChanged?: number;
  /** Maximum total changes (added + removed + changed). Undefined = no limit. */
  maxTotal?: number;
}

export interface ThresholdResult {
  passed: boolean;
  added: number;
  removed: number;
  changed: number;
  total: number;
  violations: string[];
}

export function checkThreshold(
  entries: DiffEntry[],
  opts: ThresholdOptions
): ThresholdResult {
  let added = 0;
  let removed = 0;
  let changed = 0;

  for (const e of entries) {
    if (e.change === 'added') added++;
    else if (e.change === 'removed') removed++;
    else if (e.change === 'changed') changed++;
  }

  const total = added + removed + changed;
  const violations: string[] = [];

  if (opts.maxAdded !== undefined && added > opts.maxAdded) {
    violations.push(`added ${added} exceeds limit ${opts.maxAdded}`);
  }
  if (opts.maxRemoved !== undefined && removed > opts.maxRemoved) {
    violations.push(`removed ${removed} exceeds limit ${opts.maxRemoved}`);
  }
  if (opts.maxChanged !== undefined && changed > opts.maxChanged) {
    violations.push(`changed ${changed} exceeds limit ${opts.maxChanged}`);
  }
  if (opts.maxTotal !== undefined && total > opts.maxTotal) {
    violations.push(`total ${total} exceeds limit ${opts.maxTotal}`);
  }

  return { passed: violations.length === 0, added, removed, changed, total, violations };
}

export function formatThresholdReport(result: ThresholdResult): string {
  const lines: string[] = [];
  lines.push('Threshold Check');
  lines.push('---------------');
  lines.push(`  Added   : ${result.added}`);
  lines.push(`  Removed : ${result.removed}`);
  lines.push(`  Changed : ${result.changed}`);
  lines.push(`  Total   : ${result.total}`);
  lines.push('');
  if (result.passed) {
    lines.push('Result: PASSED ✓');
  } else {
    lines.push('Result: FAILED ✗');
    for (const v of result.violations) {
      lines.push(`  - ${v}`);
    }
  }
  return lines.join('\n');
}
