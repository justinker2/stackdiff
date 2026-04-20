import * as fs from "fs";
import * as path from "path";
import { DiffEntry } from "./diffCache";

const SNAPSHOT_DIR = path.join(process.cwd(), ".stackdiff", "snapshots");

export function ensureSnapshotDir(): void {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

export function snapshotPath(name: string): string {
  return path.join(SNAPSHOT_DIR, `${name}.json`);
}

export interface Snapshot {
  name: string;
  createdAt: string;
  url1: string;
  url2: string;
  entries: DiffEntry[];
}

export function saveSnapshot(name: string, url1: string, url2: string, entries: DiffEntry[]): Snapshot {
  ensureSnapshotDir();
  const snapshot: Snapshot = {
    name,
    createdAt: new Date().toISOString(),
    url1,
    url2,
    entries,
  };
  fs.writeFileSync(snapshotPath(name), JSON.stringify(snapshot, null, 2), "utf-8");
  return snapshot;
}

export function loadSnapshot(name: string): Snapshot | null {
  const p = snapshotPath(name);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as Snapshot;
  } catch {
    return null;
  }
}

export function deleteSnapshot(name: string): boolean {
  const p = snapshotPath(name);
  if (!fs.existsSync(p)) return false;
  fs.unlinkSync(p);
  return true;
}

export function listSnapshots(): string[] {
  ensureSnapshotDir();
  return fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function compareSnapshots(a: Snapshot, b: Snapshot): { onlyInA: string[]; onlyInB: string[]; changed: string[] } {
  const pathsA = new Map(a.entries.map((e) => [e.path, e.change]));
  const pathsB = new Map(b.entries.map((e) => [e.path, e.change]));
  const onlyInA = [...pathsA.keys()].filter((k) => !pathsB.has(k));
  const onlyInB = [...pathsB.keys()].filter((k) => !pathsA.has(k));
  const changed = [...pathsA.keys()].filter((k) => pathsB.has(k) && pathsA.get(k) !== pathsB.get(k));
  return { onlyInA, onlyInB, changed };
}
