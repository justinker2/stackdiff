import { flattenDiff, formatFlattenReport, FlattenOptions } from '../diff/diffFlatten';
import type { DiffEntry } from '../diff/diffCache';

export interface FlattenArgs {
  maxDepth?: number;
  separator?: string;
  json: boolean;
}

export function parseFlattenArgs(argv: string[]): FlattenArgs {
  const args: FlattenArgs = { json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--max-depth' || arg === '-d') && argv[i + 1]) {
      const v = parseInt(argv[++i], 10);
      if (!isNaN(v) && v > 0) args.maxDepth = v;
    } else if ((arg === '--separator' || arg === '-s') && argv[i + 1]) {
      args.separator = argv[++i];
    } else if (arg === '--json') {
      args.json = true;
    }
  }
  return args;
}

export function runFlattenCommand(
  entries: DiffEntry[],
  argv: string[],
  write: (s: string) => void = console.log
): void {
  const args = parseFlattenArgs(argv);

  if (entries.length === 0) {
    write('No diff entries to flatten.');
    return;
  }

  const opts: FlattenOptions = {
    maxDepth: args.maxDepth,
    separator: args.separator,
  };

  const flat = flattenDiff(entries, opts);

  if (args.json) {
    write(JSON.stringify(flat, null, 2));
  } else {
    write(formatFlattenReport(flat));
  }
}
