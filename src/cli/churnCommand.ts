import * as fs from 'fs';
import * as path from 'path';
import { computeChurn, formatChurnReport } from '../diff/diffChurn';
import type { DiffEntry } from '../diff/diffFilter';

export interface ChurnArgs {
  snapshotDir: string;
  threshold: number;
  json: boolean;
}

export function parseChurnArgs(argv: string[]): ChurnArgs {
  const args = argv.slice(2);
  let snapshotDir = '';
  let threshold = 0.5;
  let json = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === '--dir' || arg === '-d') && args[i + 1]) {
      snapshotDir = args[++i];
    } else if (arg === '--threshold' && args[i + 1]) {
      threshold = parseFloat(args[++i]);
      if (isNaN(threshold) || threshold < 0 || threshold > 1) {
        throw new Error('--threshold must be a number between 0 and 1');
      }
    } else if (arg === '--json') {
      json = true;
    } else if (!arg.startsWith('-') && !snapshotDir) {
      snapshotDir = arg;
    }
  }

  if (!snapshotDir) {
    throw new Error('Usage: stackdiff churn <dir> [--threshold 0.5] [--json]');
  }

  return { snapshotDir, threshold, json };
}

function loadDiffsFromDir(dir: string): DiffEntry[][] {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  return files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.entries ?? [];
  });
}

export async function runChurnCommand(argv: string[]): Promise<void> {
  const args = parseChurnArgs(argv);
  const diffs = loadDiffsFromDir(args.snapshotDir);
  const report = computeChurn(diffs, args.threshold);

  if (args.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    process.stdout.write(formatChurnReport(report) + '\n');
  }

  if (report.hotspots.length > 0) {
    process.exitCode = 1;
  }
}
