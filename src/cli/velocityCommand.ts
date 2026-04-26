import * as path from 'path';
import * as fs from 'fs';
import { loadSnapshot } from '../diff/diffSnapshot';
import { computeVelocity, formatVelocityReport } from '../diff/diffVelocity';

export interface VelocityArgs {
  snapshotDir: string;
  limit: number;
}

export function parseVelocityArgs(argv: string[]): VelocityArgs {
  let snapshotDir = '.stackdiff/snapshots';
  let limit = 20;

  for (let i = 0; i < argv.length; i++) {
    if ((argv[i] === '--dir' || argv[i] === '-d') && argv[i + 1]) {
      snapshotDir = argv[++i];
    } else if ((argv[i] === '--limit' || argv[i] === '-n') && argv[i + 1]) {
      const parsed = parseInt(argv[++i], 10);
      if (!isNaN(parsed) && parsed > 0) limit = parsed;
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      printVelocityUsage();
      process.exit(0);
    }
  }

  return { snapshotDir, limit };
}

function printVelocityUsage(): void {
  console.log('Usage: stackdiff velocity [options]');
  console.log('');
  console.log('Options:');
  console.log('  --dir,   -d <path>  Directory containing snapshot files (default: .stackdiff/snapshots)');
  console.log('  --limit, -n <num>   Maximum number of snapshots to include (default: 20)');
  console.log('  --help,  -h         Show this help message');
}

export async function runVelocityCommand(argv: string[]): Promise<void> {
  const args = parseVelocityArgs(argv);

  if (!fs.existsSync(args.snapshotDir)) {
    console.error(`Snapshot directory not found: ${args.snapshotDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(args.snapshotDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .slice(-args.limit);

  if (files.length === 0) {
    console.log('No snapshots found.');
    return;
  }

  const snapshots: { timestamp: number; entries: any[] }[] = [];

  for (const file of files) {
    const name = path.basename(file, '.json');
    try {
      const snapshot = await loadSnapshot(name, args.snapshotDir);
      const timestamp = snapshot.timestamp ?? Date.parse(name) ?? Date.now();
      snapshots.push({ timestamp, entries: snapshot.entries ?? [] });
    } catch {
      // skip unreadable snapshots
    }
  }

  const report = computeVelocity(snapshots);
  console.log(formatVelocityReport(report));
}
