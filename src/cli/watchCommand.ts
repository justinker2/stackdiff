import { startWatch, WatchOptions } from '../diff/diffWatch';
import { formatDiff } from '../diff/formatDiff';

export interface WatchArgs {
  urlA: string;
  urlB: string;
  interval: number;
  maxRuns?: number;
}

export function parseWatchArgs(argv: string[]): WatchArgs {
  const args = argv.slice(2);
  if (args.length < 2) {
    throw new Error('Usage: stackdiff watch <urlA> <urlB> [--interval=<ms>] [--max-runs=<n>]');
  }
  const [urlA, urlB, ...rest] = args;
  let interval = 30000;
  let maxRuns: number | undefined;

  for (const arg of rest) {
    const intervalMatch = arg.match(/^--interval=(\d+)$/);
    if (intervalMatch) interval = parseInt(intervalMatch[1], 10);
    const maxMatch = arg.match(/^--max-runs=(\d+)$/);
    if (maxMatch) maxRuns = parseInt(maxMatch[1], 10);
  }

  return { urlA, urlB, interval, maxRuns };
}

export function runWatchCommand(args: WatchArgs): void {
  const opts: WatchOptions = {
    urlA: args.urlA,
    urlB: args.urlB,
    intervalMs: args.interval,
    maxRuns: args.maxRuns,
    onDiff: (result) => {
      console.log(`[${result.timestamp}] Poll complete — changes: ${result.hasChanges}`);
      if (result.hasChanges) {
        console.log(`  + added:   ${result.added.join(', ') || 'none'}`);
        console.log(`  - removed: ${result.removed.join(', ') || 'none'}`);
        console.log(`  ~ changed: ${result.changed.join(', ') || 'none'}`);
      }
    },
  };

  console.log(`Watching ${args.urlA} vs ${args.urlB} every ${args.interval}ms...`);
  const handle = startWatch(opts);

  process.on('SIGINT', () => {
    handle.stop();
    console.log(`\nStopped after ${handle.runCount()} run(s).`);
    process.exit(0);
  });
}
