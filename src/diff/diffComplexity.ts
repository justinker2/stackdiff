/**
 * diffComplexity.ts
 *
 * Computes a structural complexity score for each diff entry based on
 * path depth, change type, and nesting breadth. Useful for identifying
 * areas of an API response that are evolving in particularly complex ways.
 */

import type { DiffEntry } from "./shapeDiff";

export interface ComplexityEntry {
  path: string;
  change: string;
  depthScore: number;
  breadthScore: number;
  changeScore: number;
  total: number;
}

export interface ComplexityReport {
  entries: ComplexityEntry[];
  mean: number;
  max: number;
  hotspots: ComplexityEntry[];
}

/** Weight applied to each change type when computing the score. */
const CHANGE_WEIGHTS: Record<string, number> = {
  added: 1,
  removed: 2,
  changed: 3,
  missing: 2,
};

/** Returns the nesting depth of a dot-separated path. */
function pathDepth(path: string): number {
  return path.split(".").length;
}

/**
 * Counts how many other entries share the same immediate parent path,
 * representing the breadth of changes at that level.
 */
function siblingCount(path: string, all: DiffEntry[]): number {
  const parent = path.includes(".")
    ? path.slice(0, path.lastIndexOf("."))
    : "";
  return all.filter((e) => {
    const eParent = e.path.includes(".")
      ? e.path.slice(0, e.path.lastIndexOf("."))
      : "";
    return eParent === parent && e.path !== path;
  }).length;
}

/** Scores a single diff entry for structural complexity. */
function scoreEntry(entry: DiffEntry, all: DiffEntry[]): ComplexityEntry {
  const depthScore = pathDepth(entry.path);
  const breadthScore = Math.min(siblingCount(entry.path, all), 10);
  const changeScore = CHANGE_WEIGHTS[entry.change] ?? 1;
  const total = depthScore + breadthScore + changeScore;
  return {
    path: entry.path,
    change: entry.change,
    depthScore,
    breadthScore,
    changeScore,
    total,
  };
}

/** Computes complexity scores for all entries in a diff. */
export function computeComplexity(entries: DiffEntry[]): ComplexityReport {
  if (entries.length === 0) {
    return { entries: [], mean: 0, max: 0, hotspots: [] };
  }

  const scored = entries.map((e) => scoreEntry(e, entries));
  const totals = scored.map((e) => e.total);
  const sum = totals.reduce((a, b) => a + b, 0);
  const mean = Math.round((sum / scored.length) * 100) / 100;
  const max = Math.max(...totals);
  const threshold = mean + (max - mean) * 0.5;
  const hotspots = scored
    .filter((e) => e.total >= threshold)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return { entries: scored, mean, max, hotspots };
}

/** Formats a complexity report as a human-readable string. */
export function formatComplexityReport(report: ComplexityReport): string {
  if (report.entries.length === 0) {
    return "No diff entries to analyse.";
  }

  const lines: string[] = [
    `Complexity Report`,
    `  Total entries : ${report.entries.length}`,
    `  Mean score    : ${report.mean}`,
    `  Max score     : ${report.max}`,
    "",
    `Hotspots (top ${report.hotspots.length}):`,
  ];

  for (const h of report.hotspots) {
    lines.push(
      `  [${h.total.toString().padStart(3)}] ${h.path}  (${h.change})` +
        `  depth=${h.depthScore} breadth=${h.breadthScore} change=${h.changeScore}`
    );
  }

  return lines.join("\n");
}
