import { DiffEntry } from "../diff/shapeDiff";

export type MaturityLevel = "stable" | "evolving" | "volatile" | "new";

export interface MaturityEntry {
  path: string;
  changeCount: number;
  level: MaturityLevel;
  reason: string;
}

export interface MaturityReport {
  entries: MaturityEntry[];
  summary: Record<MaturityLevel, number>;
}

/**
 * Classify a path's maturity based on how frequently it appears in a
 * collection of historical diff entry arrays.
 */
export function classifyMaturity(
  path: string,
  changeCount: number
): MaturityEntry {
  let level: MaturityLevel;
  let reason: string;

  if (changeCount === 0) {
    level = "new";
    reason = "No historical changes detected";
  } else if (changeCount <= 2) {
    level = "stable";
    reason = `Changed ${changeCount} time(s) — low churn`;
  } else if (changeCount <= 5) {
    level = "evolving";
    reason = `Changed ${changeCount} time(s) — moderate churn`;
  } else {
    level = "volatile";
    reason = `Changed ${changeCount} time(s) — high churn`;
  }

  return { path, changeCount, level, reason };
}

/**
 * Build a maturity report from multiple historical diff snapshots.
 * Each snapshot is an array of DiffEntry values.
 */
export function assessMaturity(snapshots: DiffEntry[][]): MaturityReport {
  const counts = new Map<string, number>();

  for (const snapshot of snapshots) {
    for (const entry of snapshot) {
      counts.set(entry.path, (counts.get(entry.path) ?? 0) + 1);
    }
  }

  const entries: MaturityEntry[] = Array.from(counts.entries()).map(
    ([path, count]) => classifyMaturity(path, count)
  );

  entries.sort((a, b) => b.changeCount - a.changeCount);

  const summary: Record<MaturityLevel, number> = {
    stable: 0,
    evolving: 0,
    volatile: 0,
    new: 0,
  };
  for (const e of entries) summary[e.level]++;

  return { entries, summary };
}

export function formatMaturityReport(report: MaturityReport): string {
  const lines: string[] = ["=== Maturity Report ==="];
  const levelIcon: Record<MaturityLevel, string> = {
    stable: "✅",
    evolving: "🔄",
    volatile: "⚠️",
    new: "🆕",
  };

  for (const e of report.entries) {
    lines.push(`${levelIcon[e.level]} [${e.level.toUpperCase()}] ${e.path}`);
    lines.push(`   ${e.reason}`);
  }

  lines.push("");
  lines.push("Summary:");
  for (const [level, count] of Object.entries(report.summary)) {
    if (count > 0) lines.push(`  ${level}: ${count}`);
  }

  return lines.join("\n");
}
