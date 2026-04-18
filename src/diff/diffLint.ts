import { DiffEntry } from './diffAnnotate';

export type LintRule = {
  id: string;
  description: string;
  check: (entry: DiffEntry) => boolean;
};

export type LintViolation = {
  ruleId: string;
  description: string;
  path: string;
  type: DiffEntry['type'];
};

export type LintResult = {
  violations: LintViolation[];
  passed: number;
  failed: number;
};

const builtinRules: LintRule[] = [
  {
    id: 'no-type-change',
    description: 'Field type must not change between versions',
    check: (e) => e.type === 'changed',
  },
  {
    id: 'no-removal',
    description: 'Fields must not be removed',
    check: (e) => e.type === 'removed',
  },
  {
    id: 'no-unexpected-addition',
    description: 'Unexpected fields must not be added',
    check: (e) => e.type === 'added',
  },
];

export function lintDiff(
  entries: DiffEntry[],
  rules: LintRule[] = builtinRules
): LintResult {
  const violations: LintViolation[] = [];

  for (const entry of entries) {
    for (const rule of rules) {
      if (rule.check(entry)) {
        violations.push({
          ruleId: rule.id,
          description: rule.description,
          path: entry.path,
          type: entry.type,
        });
      }
    }
  }

  return {
    violations,
    passed: entries.length - violations.length,
    failed: violations.length,
  };
}

export function formatLintResult(result: LintResult): string {
  const lines: string[] = [];
  lines.push(`Lint: ${result.passed} passed, ${result.failed} failed`);
  for (const v of result.violations) {
    lines.push(`  [${v.ruleId}] ${v.path} (${v.type}) — ${v.description}`);
  }
  return lines.join('\n');
}
