import { loadHistory } from './diffHistory';
import type { DiffEntry } from './diffHistory';

export interface TrendPoint {
  timestamp: string;
  added: number;
  removed: number;
  changed: number;
  total: number;
}

export interface TrendReport {
  points: TrendPoint[];
  direction: 'improving' | 'degrading' | 'stable';
  deltaAdded: number;
  deltaRemoved: number;
  deltaChanged: number;
}

export function buildTrendPoint(entry: DiffEntry): TrendPoint {
  const added = entry.results.filter(r => r.change === 'added').length;
  const removed = entry.results.filter(r => r.change === 'removed').length;
  const changed = entry.results.filter(r => r.change === 'changed').length;
  return {
    timestamp: entry.timestamp,
    added,
    removed,
    changed,
    total: added + removed + changed,
  };
}

export function computeTrend(historyDir?: string): TrendReport {
  const history = loadHistory(historyDir);
  const points = history.map(buildTrendPoint);

  if (points.length < 2) {
    return { points, direction: 'stable', deltaAdded: 0, deltaRemoved: 0, deltaChanged: 0 };
  }

  const first = points[0];
  const last = points[points.length - 1];
  const deltaAdded = last.added - first.added;
  const deltaRemoved = last.removed - first.removed;
  const deltaChanged = last.changed - first.changed;
  const deltaTotal = last.total - first.total;

  const direction =
    deltaTotal < 0 ? 'improving' : deltaTotal > 0 ? 'degrading' : 'stable';

  return { points, direction, deltaAdded, deltaRemoved, deltaChanged };
}

export function formatTrendReport(report: TrendReport): string {
  const lines: string[] = [];
  lines.push(`Trend direction: ${report.direction}`);
  lines.push(
    `Delta — added: ${report.deltaAdded > 0 ? '+' : ''}${report.deltaAdded}, ` +
    `removed: ${report.deltaRemoved > 0 ? '+' : ''}${report.deltaRemoved}, ` +
    `changed: ${report.deltaChanged > 0 ? '+' : ''}${report.deltaChanged}`
  );
  lines.push('');
  lines.push('History:');
  for (const p of report.points) {
    lines.push(
      `  ${p.timestamp}  +${p.added} -${p.removed} ~${p.changed}  (total: ${p.total})`
    );
  }
  return lines.join('\n');
}
