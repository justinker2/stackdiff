import * as fs from 'fs';
import { detectRenames, formatRenameReport } from '../diff/diffRename';
import { DiffEntry } from '../diff/diffFilter';

export interface RenameArgs {
  inputFile: string;
  json: boolean;
}

export function parseRenameArgs(argv: string[]): RenameArgs {
  const args = argv.slice(2);
  const jsonFlag = args.includes('--json');
  const positional = args.filter((a) => !a.startsWith('--'));

  if (positional.length < 1) {
    console.error('Usage: stackdiff rename <diff-file.json> [--json]');
    process.exit(1);
  }

  return { inputFile: positional[0], json: jsonFlag };
}

export async function runRenameCommand(argv: string[]): Promise<void> {
  const { inputFile, json } = parseRenameArgs(argv);

  let entries: DiffEntry[];
  try {
    const raw = fs.readFileSync(inputFile, 'utf-8');
    entries = JSON.parse(raw) as DiffEntry[];
  } catch (err) {
    console.error(`Failed to read diff file: ${inputFile}`);
    console.error((err as Error).message);
    process.exit(1);
  }

  const result = detectRenames(entries);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatRenameReport(result));
  }
}
