/**
 * diffChurn.ts — measures how frequently paths change across multiple diff entries.
 * Churn is defined as the number of times a path appears changed across a set of diffs.
 */

import type { DiffEntry } from './diffFilter';

export interface ChurnEntry {
  path: string;
  count: number;
  changeTypes: string[];
  churnRate: number; // count / totalDiffs
}

export interface ChurnReport {
  totalDiffs: number;
  entries: ChurnEntry[];
  hotspots: ChurnEntry[];
}

export function computeChurn(
  diffs: DiffEntry[][],
  hotspotThreshold = 0.5
): ChurnReport {
  const totalDiffs = diffs.length;
  const countMap = new Map<string, string[]>();

  for (const diff of diffs) {
    for (const entry of diff) {
      const existing = countMap.get(entry.path) ?? [];
      existing.push(entry.change);
      countMap.set(entry.path, existing);
    }
  }

  const entries: ChurnEntry[] = Array.from(countMap.entries())
    .map(([path, changeTypes]) => ({
      path,
      count: changeTypes.length,
      changeTypes,
      churnRate: totalDiffs > 0 ? changeTypes.length / totalDiffs : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const hotspots = entries.filter((e) => e.churnRate >= hotspotThreshold);

  return { totalDiffs, entries, hotspots };
}

export function formatChurnReport(report: ChurnReport): string {
  const lines: string[] = [
    `Churn Report (${report.totalDiffs} diff(s) analysed)`,
    '='.repeat(48),
  ];

  if (report.entries.length === 0) {
    lines.push('No changes detected.');
    return lines.join('\n');
  }

  for (const e of report.entries) {
    const pct = (e.churnRate * 100).toFixed(1);
    const flag = e.churnRate >= 0.5 ? ' 🔥' : '';
    lines.push(`  ${e.path}${flag}`);
    lines.push(`    count=${e.count}  rate=${pct}%  types=[${[...new Set(e.changeTypes)].join(', ')}]`);
  }

  lines.push('');
  lines.push(`Hotspots (rate >= 50%): ${report.hotspots.length}`);
  return lines.join('\n');
}
