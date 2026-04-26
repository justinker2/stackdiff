/**
 * diffDrift.ts
 *
 * Detects "drift" between two diff snapshots over time — i.e. paths whose
 * change-type has shifted (e.g. a field that was "added" in one snapshot is
 * now "removed", or a field that was stable has started changing).
 *
 * Drift is useful for catching regressions or unexpected reversals in API
 * shape evolution.
 */

import type { DiffEntry } from "../diff/shapeDiff";

export type ChangeType = "added" | "removed" | "changed" | "unchanged";

export interface DriftEntry {
  path: string;
  before: ChangeType;
  after: ChangeType;
  /** Human-readable description of the drift kind */
  kind: DriftKind;
}

export type DriftKind =
  | "reversed"   // added → removed or removed → added
  | "stabilized" // changed/added/removed → unchanged
  | "destabilized" // unchanged → changed/added/removed
  | "shifted";   // any other change-type transition

export interface DriftReport {
  entries: DriftEntry[];
  totalBefore: number;
  totalAfter: number;
  driftCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function changeType(entry: DiffEntry): ChangeType {
  switch (entry.change) {
    case "+": return "added";
    case "-": return "removed";
    case "~": return "changed";
    default:  return "unchanged";
  }
}

function classifyDrift(before: ChangeType, after: ChangeType): DriftKind {
  if (
    (before === "added" && after === "removed") ||
    (before === "removed" && after === "added")
  ) {
    return "reversed";
  }
  if (after === "unchanged") return "stabilized";
  if (before === "unchanged") return "destabilized";
  return "shifted";
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Compare two sets of DiffEntries (e.g. from two different runs / snapshots)
 * and return every path whose change-type has shifted.
 */
export function detectDrift(
  before: DiffEntry[],
  after: DiffEntry[]
): DriftReport {
  const beforeMap = new Map<string, ChangeType>();
  for (const e of before) beforeMap.set(e.path, changeType(e));

  const afterMap = new Map<string, ChangeType>();
  for (const e of after) afterMap.set(e.path, changeType(e));

  // Union of all paths
  const allPaths = new Set<string>([
    ...beforeMap.keys(),
    ...afterMap.keys(),
  ]);

  const entries: DriftEntry[] = [];

  for (const path of allPaths) {
    const b = beforeMap.get(path) ?? "unchanged";
    const a = afterMap.get(path) ?? "unchanged";
    if (b !== a) {
      entries.push({ path, before: b, after: a, kind: classifyDrift(b, a) });
    }
  }

  // Sort by drift kind priority then path
  const kindOrder: DriftKind[] = ["reversed", "destabilized", "shifted", "stabilized"];
  entries.sort((x, y) => {
    const kd = kindOrder.indexOf(x.kind) - kindOrder.indexOf(y.kind);
    return kd !== 0 ? kd : x.path.localeCompare(y.path);
  });

  return {
    entries,
    totalBefore: before.length,
    totalAfter: after.length,
    driftCount: entries.length,
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const DRIFT_ICON: Record<DriftKind, string> = {
  reversed:      "⇄",
  destabilized:  "↯",
  shifted:       "→",
  stabilized:    "✓",
};

export function formatDriftReport(report: DriftReport): string {
  const lines: string[] = [
    `Drift report  before=${report.totalBefore} entries  after=${report.totalAfter} entries  drifted=${report.driftCount}`,
    "",
  ];

  if (report.entries.length === 0) {
    lines.push("  No drift detected — change types are stable.");
    return lines.join("\n");
  }

  for (const e of report.entries) {
    const icon = DRIFT_ICON[e.kind];
    lines.push(
      `  ${icon} [${e.kind.padEnd(13)}]  ${e.before.padEnd(9)} → ${e.after.padEnd(9)}  ${e.path}`
    );
  }

  lines.push("");
  const byKind = report.entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.kind] = (acc[e.kind] ?? 0) + 1;
    return acc;
  }, {});
  lines.push(
    "  Summary: " +
    Object.entries(byKind)
      .map(([k, n]) => `${k}=${n}`)
      .join("  ")
  );

  return lines.join("\n");
}
