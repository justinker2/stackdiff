import * as fs from "fs";
import * as path from "path";
import { assessMaturity, formatMaturityReport } from "../diff/diffMaturity";
import { DiffEntry } from "../diff/shapeDiff";

export interface MaturityArgs {
  snapshotDir: string;
  format: "text" | "json";
}

export function parseMaturityArgs(argv: string[]): MaturityArgs {
  const args: MaturityArgs = {
    snapshotDir: ".stackdiff/snapshots",
    format: "text",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === "--dir" || arg === "-d") && argv[i + 1]) {
      args.snapshotDir = argv[++i];
    } else if (arg === "--json") {
      args.format = "json";
    }
  }

  return args;
}

function loadSnapshotsFromDir(dir: string): DiffEntry[][] {
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const snapshots: DiffEntry[][] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) snapshots.push(parsed as DiffEntry[]);
    } catch {
      // skip malformed snapshot files
    }
  }
  return snapshots;
}

export function runMaturityCommand(argv: string[]): void {
  const args = parseMaturityArgs(argv);
  const snapshots = loadSnapshotsFromDir(args.snapshotDir);

  if (snapshots.length === 0) {
    console.error(
      `No snapshot files found in "${args.snapshotDir}". Run 'stackdiff snapshot save' first.`
    );
    process.exit(1);
  }

  const report = assessMaturity(snapshots);

  if (args.format === "json") {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatMaturityReport(report));
  }
}
