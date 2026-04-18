import { loadHistory } from '../diff/diffHistory';
import { mergeDiffs, formatMergeConflicts } from '../diff/diffMerge';
import { DiffEntry } from '../diff/diffFilter';

export interface MergeArgs {
  baseLabel: string;
  incomingLabel: string;
  verbose: boolean;
}

export function parseMergeArgs(argv: string[]): MergeArgs {
  const [baseLabel, incomingLabel] = argv;
  if (!baseLabel || !incomingLabel) {
    throw new Error('Usage: merge <baseLabel> <incomingLabel>');
  }
  return { baseLabel, incomingLabel, verbose: argv.includes('--verbose') };
}

export async function runMergeCommand(args: MergeArgs): Promise<void> {
  const history = await loadHistory();

  const baseEntries = history.filter((h) => h.label === args.baseLabel);
  const incomingEntries = history.filter((h) => h.label === args.incomingLabel);

  if (baseEntries.length === 0) {
    console.error(`No history found for label: ${args.baseLabel}`);
    process.exit(1);
  }
  if (incomingEntries.length === 0) {
    console.error(`No history found for label: ${args.incomingLabel}`);
    process.exit(1);
  }

  const baseDiff: DiffEntry[] = baseEntries.flatMap((e) => e.diff as DiffEntry[]);
  const incomingDiff: DiffEntry[] = incomingEntries.flatMap((e) => e.diff as DiffEntry[]);

  const { merged, conflicts } = mergeDiffs(baseDiff, incomingDiff);

  console.log(`Merged ${merged.length} entries.`);

  if (conflicts.length > 0) {
    console.warn(`\n${conflicts.length} conflict(s) detected:`);
    console.warn(formatMergeConflicts(conflicts));
  } else {
    console.log('No conflicts.');
  }

  if (args.verbose) {
    console.log('\nMerged diff:');
    merged.forEach((e) => console.log(`  [${e.change}] ${e.path}`));
  }
}
