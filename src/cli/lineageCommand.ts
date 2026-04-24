import * as fs from 'fs';
import * as path from 'path';
import { buildAllLineages, buildLineage, formatLineageReport } from '../diff/diffLineage';
import type { DiffEntry } from '../diff/shapeDiff';

export interface LineageArgs {
  snapshotDir: string;
  filterPath?: string;
  outputFile?: string;
}

export function parseLineageArgs(argv: string[]): LineageArgs {
  const args: LineageArgs = { snapshotDir: '' };
  for (let i = 0; i < argv.length; i++) {
    if ((argv[i] === '--dir' || argv[i] === '-d') && argv[i + 1]) {
      args.snapshotDir = argv[++i];
    } else if ((argv[i] === '--path' || argv[i] === '-p') && argv[i + 1]) {
      args.filterPath = argv[++i];
    } else if ((argv[i] === '--output' || argv[i] === '-o') && argv[i + 1]) {
      args.outputFile = argv[++i];
    }
  }
  if (!args.snapshotDir) {
    throw new Error('--dir <snapshotDir> is required for lineage command');
  }
  return args;
}

interface SnapshotFile {
  timestamp: string;
  entries: DiffEntry[];
}

function loadSnapshots(dir: string): SnapshotFile[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
      return JSON.parse(raw) as SnapshotFile;
    });
}

export function runLineageCommand(args: LineageArgs): void {
  const snapshots = loadSnapshots(args.snapshotDir);
  if (snapshots.length === 0) {
    console.log('No snapshots found in', args.snapshotDir);
    return;
  }

  const records = args.filterPath
    ? [buildLineage(args.filterPath, snapshots)]
    : buildAllLineages(snapshots);

  const report = formatLineageReport(records);

  if (args.outputFile) {
    fs.writeFileSync(args.outputFile, report, 'utf-8');
    console.log(`Lineage report written to ${args.outputFile}`);
  } else {
    console.log(report);
  }
}
