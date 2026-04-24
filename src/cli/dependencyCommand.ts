import { compareResponses } from '../diff/index';
import { detectDependencies, formatDependencyReport } from '../diff/diffDependency';
import { parseArgs } from './parseArgs';

export interface DependencyArgs {
  urlA: string;
  urlB: string;
  headersA: Record<string, string>;
  headersB: Record<string, string>;
  json: boolean;
}

export function parseDependencyArgs(argv: string[]): DependencyArgs {
  const base = parseArgs(argv);
  const json = argv.includes('--json');
  return {
    urlA: base.urlA,
    urlB: base.urlB,
    headersA: base.headersA,
    headersB: base.headersB,
    json,
  };
}

export async function runDependencyCommand(argv: string[]): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printDependencyUsage();
    return;
  }

  const args = parseDependencyArgs(argv);

  const entries = await compareResponses(
    args.urlA,
    args.urlB,
    args.headersA,
    args.headersB
  );

  const report = detectDependencies(entries);

  if (args.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    return;
  }

  console.log(formatDependencyReport(report));

  const exitCode = report.pairs.some(p => p.type === 'removed-together') ? 1 : 0;
  process.exitCode = exitCode;
}

export function printDependencyUsage(): void {
  console.log(`
Usage: stackdiff dependency <urlA> <urlB> [options]

Detects field dependency relationships between two API responses.

Options:
  --header-a KEY:VALUE   Headers for urlA (repeatable)
  --header-b KEY:VALUE   Headers for urlB (repeatable)
  --json                 Output raw JSON report
  -h, --help             Show this help message
`);
}
