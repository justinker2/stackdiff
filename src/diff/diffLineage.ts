/**
 * diffLineage: tracks the ancestry/lineage of a diff path across multiple
 * historical snapshots, showing how a field evolved over time.
 */

import type { DiffEntry } from './shapeDiff';

export interface LineagePoint {
  timestamp: string;
  changeType: DiffEntry['change'];
  fromType?: string;
  toType?: string;
}

export interface LineageRecord {
  path: string;
  points: LineagePoint[];
}

export function buildLineage(
  path: string,
  snapshots: Array<{ timestamp: string; entries: DiffEntry[] }>
): LineageRecord {
  const points: LineagePoint[] = [];

  for (const snap of snapshots) {
    const match = snap.entries.find((e) => e.path === path);
    if (match) {
      points.push({
        timestamp: snap.timestamp,
        changeType: match.change,
        fromType: match.from ?? undefined,
        toType: match.to ?? undefined,
      });
    }
  }

  return { path, points };
}

export function buildAllLineages(
  snapshots: Array<{ timestamp: string; entries: DiffEntry[] }>
): LineageRecord[] {
  const pathSet = new Set<string>();
  for (const snap of snapshots) {
    for (const entry of snap.entries) {
      pathSet.add(entry.path);
    }
  }

  return Array.from(pathSet).map((p) => buildLineage(p, snapshots));
}

export function formatLineageReport(records: LineageRecord[]): string {
  if (records.length === 0) return 'No lineage data.';
  const lines: string[] = ['Lineage Report', '=============='];

  for (const rec of records) {
    lines.push(`\nPath: ${rec.path}`);
    if (rec.points.length === 0) {
      lines.push('  (no recorded changes)');
    } else {
      for (const pt of rec.points) {
        const detail =
          pt.fromType && pt.toType
            ? ` [${pt.fromType} → ${pt.toType}]`
            : pt.toType
            ? ` [added as ${pt.toType}]`
            : pt.fromType
            ? ` [removed ${pt.fromType}]`
            : '';
        lines.push(`  ${pt.timestamp}  ${pt.changeType}${detail}`);
      }
    }
  }

  return lines.join('\n');
}
