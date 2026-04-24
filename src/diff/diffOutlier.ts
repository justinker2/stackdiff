import type { DiffEntry } from "./diffFilter";

export interface OutlierResult {
  entry: DiffEntry;
  zscore: number;
  isOutlier: boolean;
}

export interface OutlierReport {
  results: OutlierResult[];
  mean: number;
  stddev: number;
  threshold: number;
}

function pathDepth(path: string): number {
  return path.split(".").length;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function detectOutliers(
  entries: DiffEntry[],
  threshold = 2.0
): OutlierReport {
  const depths = entries.map((e) => pathDepth(e.path));
  const avg = mean(depths);
  const sd = stddev(depths, avg);

  const results: OutlierResult[] = entries.map((entry, i) => {
    const zscore = sd === 0 ? 0 : (depths[i] - avg) / sd;
    return { entry, zscore, isOutlier: Math.abs(zscore) >= threshold };
  });

  return { results, mean: avg, stddev: sd, threshold };
}

export function formatOutlierReport(report: OutlierReport): string {
  const outliers = report.results.filter((r) => r.isOutlier);
  if (outliers.length === 0) {
    return "No outliers detected.";
  }

  const lines: string[] = [
    `Outlier Detection (threshold z=${report.threshold}, mean depth=${report.mean.toFixed(2)}, stddev=${report.stddev.toFixed(2)})`,
    "",
  ];

  for (const { entry, zscore } of outliers) {
    lines.push(
      `  [${entry.change.toUpperCase()}] ${entry.path}  (z=${zscore.toFixed(2)})`
    );
  }

  lines.push("");
  lines.push(`${outliers.length} outlier(s) found out of ${report.results.length} entries.`);
  return lines.join("\n");
}
