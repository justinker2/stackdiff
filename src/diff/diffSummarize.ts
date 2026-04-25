import type { DiffEntry } from "./shapeDiff";

export interface DiffSummary {
  total: number;
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
  topPaths: string[];
  changeRate: number;
}

export function summarizeDiff(entries: DiffEntry[]): DiffSummary {
  const total = entries.length;
  let added = 0;
  let removed = 0;
  let changed = 0;
  let unchanged = 0;

  for (const entry of entries) {
    switch (entry.change) {
      case "added":     added++;     break;
      case "removed":   removed++;   break;
      case "changed":   changed++;   break;
      case "unchanged": unchanged++; break;
    }
  }

  const topPaths = entries
    .filter((e) => e.change !== "unchanged")
    .sort((a, b) => a.path.localeCompare(b.path))
    .slice(0, 5)
    .map((e) => e.path);

  const changeRate = total > 0 ? (added + removed + changed) / total : 0;

  return { total, added, removed, changed, unchanged, topPaths, changeRate };
}

export function formatSummaryReport(summary: DiffSummary): string {
  const pct = (summary.changeRate * 100).toFixed(1);
  const lines: string[] = [
    "=== Diff Summary ===",
    `Total paths : ${summary.total}`,
    `  Added     : ${summary.added}`,
    `  Removed   : ${summary.removed}`,
    `  Changed   : ${summary.changed}`,
    `  Unchanged : ${summary.unchanged}`,
    `Change rate : ${pct}%`,
  ];

  if (summary.topPaths.length > 0) {
    lines.push("", "Top changed paths:");
    for (const p of summary.topPaths) {
      lines.push(`  - ${p}`);
    }
  }

  return lines.join("\n");
}
