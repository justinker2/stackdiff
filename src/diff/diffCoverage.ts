import { DiffEntry } from "./shapeDiff";

export interface CoverageResult {
  totalPaths: number;
  changedPaths: number;
  coveragePercent: number;
  byChangeType: Record<string, number>;
  uncoveredPaths: string[];
}

export function computeCoverage(
  entries: DiffEntry[],
  allPaths: string[]
): CoverageResult {
  const changedSet = new Set(entries.map((e) => e.path));
  const totalPaths = allPaths.length;
  const changedPaths = changedSet.size;
  const coveragePercent =
    totalPaths === 0 ? 0 : Math.round((changedPaths / totalPaths) * 10000) / 100;

  const byChangeType: Record<string, number> = {};
  for (const entry of entries) {
    byChangeType[entry.change] = (byChangeType[entry.change] ?? 0) + 1;
  }

  const uncoveredPaths = allPaths.filter((p) => !changedSet.has(p));

  return { totalPaths, changedPaths, coveragePercent, byChangeType, uncoveredPaths };
}

export function formatCoverageReport(result: CoverageResult): string {
  const lines: string[] = [];
  lines.push("=== Diff Coverage Report ===");
  lines.push(
    `Coverage: ${result.coveragePercent}% (${result.changedPaths}/${result.totalPaths} paths)`
  );

  if (Object.keys(result.byChangeType).length > 0) {
    lines.push("");
    lines.push("Changes by type:");
    for (const [type, count] of Object.entries(result.byChangeType)) {
      lines.push(`  ${type}: ${count}`);
    }
  }

  if (result.uncoveredPaths.length > 0) {
    lines.push("");
    lines.push(`Uncovered paths (${result.uncoveredPaths.length}):`);
    for (const p of result.uncoveredPaths.slice(0, 10)) {
      lines.push(`  - ${p}`);
    }
    if (result.uncoveredPaths.length > 10) {
      lines.push(`  ... and ${result.uncoveredPaths.length - 10} more`);
    }
  }

  return lines.join("\n");
}
