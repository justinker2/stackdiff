import { checkBudget, formatBudgetReport, BudgetRule } from '../diff/diffBudget';
import { filterDiff } from '../diff/diffFilter';
import type { DiffEntry } from '../diff/diffFilter';

export interface BudgetArgs {
  entries: DiffEntry[];
  rule: BudgetRule;
  strict: boolean;
}

export function parseBudgetArgs(argv: string[]): BudgetArgs {
  const rule: BudgetRule = {};
  let strict = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--max-added' && argv[i + 1]) {
      rule.maxAdded = Number(argv[++i]);
    } else if (arg === '--max-removed' && argv[i + 1]) {
      rule.maxRemoved = Number(argv[++i]);
    } else if (arg === '--max-changed' && argv[i + 1]) {
      rule.maxChanged = Number(argv[++i]);
    } else if (arg === '--max-total' && argv[i + 1]) {
      rule.maxTotal = Number(argv[++i]);
    } else if (arg === '--strict') {
      strict = true;
    }
  }

  return { entries: [], rule, strict };
}

export function runBudgetCommand(
  entries: DiffEntry[],
  argv: string[],
  write: (s: string) => void = console.log
): number {
  const { rule, strict } = parseBudgetArgs(argv);
  const active = filterDiff(entries, {});
  const result = checkBudget(active, rule);

  write(formatBudgetReport(result));

  if (!result.passed) {
    if (strict) {
      write('Budget exceeded — exiting with error.');
      return 1;
    }
    write('Budget exceeded (non-strict mode).');
  }

  return result.passed ? 0 : 1;
}
