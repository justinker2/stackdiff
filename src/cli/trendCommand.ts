import { computeTrend, formatTrendReport } from '../diff/diffTrend';

export interface TrendArgs {
  historyDir?: string;
  json: boolean;
}

export function parseTrendArgs(argv: string[]): TrendArgs {
  const args: TrendArgs = { json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--history-dir' && argv[i + 1]) {
      args.historyDir = argv[++i];
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--help' || arg === '-h') {
      printTrendUsage();
      process.exit(0);
    }
  }
  return args;
}

export function printTrendUsage(): void {
  console.log(
    [
      'Usage: stackdiff trend [options]',
      '',
      'Options:',
      '  --history-dir <dir>   Path to history directory (default: ~/.stackdiff/history)',
      '  --json                Output report as JSON',
      '  -h, --help            Show this help message',
    ].join('\n')
  );
}

export async function runTrendCommand(argv: string[]): Promise<void> {
  const args = parseTrendArgs(argv);
  const report = computeTrend(args.historyDir);

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (report.points.length === 0) {
    console.log('No history entries found. Run some comparisons first.');
    return;
  }

  console.log(formatTrendReport(report));
}
