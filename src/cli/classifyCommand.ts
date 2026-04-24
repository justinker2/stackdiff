import { DiffEntry } from '../diff/shapeDiff';
import {
  classifyDiff,
  groupByClass,
  formatClassifyReport,
} from '../diff/diffClassify';
import { compareResponses } from '../diff';
import { parseArgs } from './parseArgs';

export interface ClassifyArgs {
  urlA: string;
  urlB: string;
  headersA: Record<string, string>;
  headersB: Record<string, string>;
  json: boolean;
}

export function parseClassifyArgs(argv: string[]): ClassifyArgs {
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

export async function runClassifyCommand(argv: string[]): Promise<void> {
  const args = parseClassifyArgs(argv);

  let entries: DiffEntry[];
  try {
    entries = await compareResponses(
      args.urlA,
      args.urlB,
      args.headersA,
      args.headersB
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error fetching responses: ${msg}\n`);
    process.exit(1);
  }

  const classified = classifyDiff(entries);
  const groups = groupByClass(classified);

  if (args.json) {
    process.stdout.write(JSON.stringify(groups, null, 2) + '\n');
  } else {
    process.stdout.write(formatClassifyReport(groups) + '\n');
  }
}
