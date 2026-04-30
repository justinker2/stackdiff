import { DiffEntry } from "./shapeDiff";

export interface HeatmapCell {
  path: string;
  changeCount: number;
  intensity: number; // 0.0 – 1.0
  label: string;
}

export interface HeatmapReport {
  cells: HeatmapCell[];
  maxChanges: number;
  totalPaths: number;
}

function segmentRoot(path: string): string {
  return path.split(".")[0] ?? path;
}

function intensityLabel(intensity: number): string {
  if (intensity >= 0.75) return "high";
  if (intensity >= 0.4) return "medium";
  return "low";
}

export function buildHeatmap(entries: DiffEntry[]): HeatmapReport {
  const freq = new Map<string, number>();

  for (const entry of entries) {
    const root = segmentRoot(entry.path);
    freq.set(root, (freq.get(root) ?? 0) + 1);
  }

  const maxChanges = Math.max(0, ...freq.values());

  const cells: HeatmapCell[] = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([path, changeCount]) => {
      const intensity = maxChanges > 0 ? changeCount / maxChanges : 0;
      return { path, changeCount, intensity, label: intensityLabel(intensity) };
    });

  return { cells, maxChanges, totalPaths: cells.length };
}

export function formatHeatmapReport(report: HeatmapReport): string {
  if (report.cells.length === 0) {
    return "Heatmap: no changes detected.";
  }

  const lines: string[] = [
    `Heatmap (${report.totalPaths} root paths, max changes: ${report.maxChanges})`,
    "-".repeat(52),
  ];

  for (const cell of report.cells) {
    const bar = "█".repeat(Math.round(cell.intensity * 20)).padEnd(20);
    const pct = (cell.intensity * 100).toFixed(0).padStart(3);
    lines.push(
      `  ${cell.path.padEnd(24)} ${bar} ${pct}%  [${cell.label}] (${cell.changeCount})`
    );
  }

  return lines.join("\n");
}
