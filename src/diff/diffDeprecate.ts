/**
 * diffDeprecate: detect and annotate deprecated fields in a diff.
 * A field is considered deprecated if its path matches a configured pattern
 * and it still appears as 'unchanged' or 'added' in the diff.
 */

import type { DiffEntry } from './shapeDiff';

export interface DeprecationRule {
  pattern: string; // glob-style or substring match
  reason?: string;
}

export interface DeprecationResult {
  entry: DiffEntry;
  rule: DeprecationRule;
  message: string;
}

export function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

export function findDeprecations(
  entries: DiffEntry[],
  rules: DeprecationRule[]
): DeprecationResult[] {
  const results: DeprecationResult[] = [];

  for (const entry of entries) {
    if (entry.change === 'removed') continue;
    for (const rule of rules) {
      const regex = patternToRegex(rule.pattern);
      if (regex.test(entry.path)) {
        results.push({
          entry,
          rule,
          message: rule.reason
            ? `Deprecated field "${entry.path}": ${rule.reason}`
            : `Deprecated field "${entry.path}"`,
        });
        break;
      }
    }
  }

  return results;
}

export function formatDeprecationReport(results: DeprecationResult[]): string {
  if (results.length === 0) return 'No deprecated fields found.';
  const lines = [`Deprecated fields (${results.length}):`];
  for (const r of results) {
    lines.push(`  [${r.entry.change.toUpperCase()}] ${r.message}`);
  }
  return lines.join('\n');
}
