import {
  saveSnapshot,
  loadSnapshot,
  deleteSnapshot,
  listSnapshots,
  compareSnapshots,
} from "../diff/diffSnapshot";
import { compareResponses } from "../diff";
import { parseArgs } from "./parseArgs";

export interface SnapshotArgs {
  subcommand: "save" | "load" | "delete" | "list" | "compare";
  name?: string;
  compareTo?: string;
  url1?: string;
  url2?: string;
}

export function parseSnapshotArgs(argv: string[]): SnapshotArgs {
  const [subcommand, ...rest] = argv;
  if (!subcommand) throw new Error("snapshot subcommand required: save | load | delete | list | compare");

  const args: SnapshotArgs = { subcommand: subcommand as SnapshotArgs["subcommand"] };

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--name" && rest[i + 1]) { args.name = rest[++i]; }
    else if (rest[i] === "--compare-to" && rest[i + 1]) { args.compareTo = rest[++i]; }
    else if (!args.url1 && !rest[i].startsWith("--")) { args.url1 = rest[i]; }
    else if (!args.url2 && !rest[i].startsWith("--")) { args.url2 = rest[i]; }
  }

  return args;
}

export async function runSnapshotCommand(argv: string[]): Promise<void> {
  const args = parseSnapshotArgs(argv);

  if (args.subcommand === "list") {
    const names = listSnapshots();
    if (names.length === 0) { console.log("No snapshots saved."); return; }
    names.forEach((n) => console.log(` - ${n}`));
    return;
  }

  if (args.subcommand === "delete") {
    if (!args.name) throw new Error("--name required for delete");
    const ok = deleteSnapshot(args.name);
    console.log(ok ? `Deleted snapshot '${args.name}'.` : `Snapshot '${args.name}' not found.`);
    return;
  }

  if (args.subcommand === "load") {
    if (!args.name) throw new Error("--name required for load");
    const snap = loadSnapshot(args.name);
    if (!snap) { console.log(`Snapshot '${args.name}' not found.`); return; }
    console.log(`Snapshot: ${snap.name} (${snap.createdAt})`);
    console.log(`  ${snap.url1}  vs  ${snap.url2}`);
    console.log(`  ${snap.entries.length} diff entries`);
    return;
  }

  if (args.subcommand === "save") {
    if (!args.name) throw new Error("--name required for save");
    if (!args.url1 || !args.url2) throw new Error("Two URLs required for save");
    const { entries } = await compareResponses(args.url1, args.url2, {});
    saveSnapshot(args.name, args.url1, args.url2, entries);
    console.log(`Snapshot '${args.name}' saved with ${entries.length} entries.`);
    return;
  }

  if (args.subcommand === "compare") {
    if (!args.name || !args.compareTo) throw new Error("--name and --compare-to required for compare");
    const a = loadSnapshot(args.name);
    const b = loadSnapshot(args.compareTo);
    if (!a) throw new Error(`Snapshot '${args.name}' not found`);
    if (!b) throw new Error(`Snapshot '${args.compareTo}' not found`);
    const result = compareSnapshots(a, b);
    console.log(`Comparing '${args.name}' vs '${args.compareTo}'`);
    console.log(`  Only in ${args.name}: ${result.onlyInA.length}`);
    console.log(`  Only in ${args.compareTo}: ${result.onlyInB.length}`);
    console.log(`  Changed: ${result.changed.length}`);
    result.changed.forEach((p) => console.log(`    ~ ${p}`));
  }
}
