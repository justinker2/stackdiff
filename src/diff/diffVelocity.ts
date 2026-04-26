import { DiffEntry } from './diffHistory';

export interface VelocityPoint {
  timestamp: number;
  added: number;
  removed: number;
  changed: number;
  total: number;
}

export interface VelocityReport {
  points: VelocityPoint[];
  avgAdded: number;
  avgRemoved: number;
  avgChanged: number;
  peakTotal: number;
  peakTimestamp: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeVelocity(
  snapshots: { timestamp: number; entries: DiffEntry[] }[]
): VelocityReport {
  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);

  const points: VelocityPoint[] = sorted.map(({ timestamp, entries }) => {
    const added = entries.filter(e => e.change === 'added').length;
    const removed = entries.filter(e => e.change === 'removed').length;
    const changed = entries.filter(e => e.change === 'changed').length;
    return { timestamp, added, removed, changed, total: added + removed + changed };
  });

  const count = points.length || 1;
  const avgAdded = round2(points.reduce((s, p) => s + p.added, 0) / count);
  const avgRemoved = round2(points.reduce((s, p) => s + p.removed, 0) / count);
  const avgChanged = round2(points.reduce((s, p) => s + p.changed, 0) / count);

  const peak = points.reduce((best, p) => (p.total > best.total ? p : best), points[0] ?? { total: 0, timestamp: 0 });

  return {
    points,
    avgAdded,
    avgRemoved,
    avgChanged,
    peakTotal: peak.total,
    peakTimestamp: peak.timestamp,
  };
}

export function formatVelocityReport(report: VelocityReport): string {
  const lines: string[] = ['Velocity Report', '==============='];

  if (report.points.length === 0) {
    lines.push('No data points.');
    return lines.join('\n');
  }

  lines.push(`Snapshots analysed : ${report.points.length}`);
  lines.push(`Avg added/snapshot : ${report.avgAdded}`);
  lines.push(`Avg removed/snapshot: ${report.avgRemoved}`);
  lines.push(`Avg changed/snapshot: ${report.avgChanged}`);
  lines.push(
    `Peak snapshot      : ${new Date(report.peakTimestamp).toISOString()} (${report.peakTotal} changes)`
  );

  lines.push('');
  lines.push('Timeline:');
  for (const p of report.points) {
    const ts = new Date(p.timestamp).toISOString();
    lines.push(`  ${ts}  +${p.added} -${p.removed} ~${p.changed}`);
  }

  return lines.join('\n');
}
