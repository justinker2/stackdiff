import * as fs from 'fs';
import { cohortDiff, formatCohortReport } from '../diff/diffCohort';
import type { DiffEntry } from '../diff/diffFilter';

export interface CohortArgs {
  inputFile: string;
  json: boolean;
}

export function parseCohortArgs(argv: string[]): CohortArgs {
  const args = argv.slice(2);
  let inputFile = '';
  let json = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') {
      json = true;
    } else if (args[i] === '--input' && args[i + 1]) {
      inputFile = args[++i];
    } else if (!inputFile && !args[i].startsWith('--')) {
      inputFile = args[i];
    }
  }

  if (!inputFile) {
    console.error('Usage: stackdiff cohort <input.json> [--json]');
    process.exit(1);
  }

  return { inputFile, json };
}

export async function runCohortCommand(argv: string[]): Promise<void> {
  const { inputFile, json } = parseCohortArgs(argv);

  let raw: string;
  try {
    raw = fs.readFileSync(inputFile, 'utf8');
  } catch {
    console.error(`Cannot read file: ${inputFile}`);
    process.exit(1);
  }

  let entries: DiffEntry[];
  try {
    entries = JSON.parse(raw) as DiffEntry[];
  } catch {
    console.error('Input file is not valid JSON.');
    process.exit(1);
  }

  const report = cohortDiff(entries);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatCohortReport(report));
  }
}
