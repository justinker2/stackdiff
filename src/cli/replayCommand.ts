import { DiffEntry } from '../diff/shapeDiff';
import { replayDiff, formatReplayReport, buildReplaySteps } from '../diff/diffReplay';

export interface ReplayArgs {
  entries: DiffEntry[];
  delay: number;
  filter?: string; // change type filter: added|removed|changed
  report: boolean;
}

export function parseReplayArgs(argv: string[]): ReplayArgs {
  const args: ReplayArgs = { entries: [], delay: 0, report: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--delay' && argv[i + 1]) {
      args.delay = parseInt(argv[++i], 10);
    } else if (arg === '--filter' && argv[i + 1]) {
      args.filter = argv[++i];
    } else if (arg === '--report') {
      args.report = true;
    }
  }
  return args;
}

export async function runReplayCommand(
  entries: DiffEntry[],
  argv: string[],
  out: (line: string) => void = console.log
): Promise<void> {
  const args = parseReplayArgs(argv);

  const filterFn = args.filter
    ? (e: DiffEntry) => e.change === args.filter
    : undefined;

  if (args.report) {
    const steps = buildReplaySteps(entries, { filter: filterFn });
    out(formatReplayReport(steps));
    return;
  }

  await replayDiff(
    entries,
    (step) => {
      const { index, entry } = step;
      const from = entry.from !== undefined ? `  from: ${entry.from}` : '';
      const to = entry.to !== undefined ? `  to:   ${entry.to}` : '';
      out(`[${index + 1}] ${entry.change.toUpperCase().padEnd(8)} ${entry.path}${from}${to}`);
    },
    { delay: args.delay, filter: filterFn }
  );
}
