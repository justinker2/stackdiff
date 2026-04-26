import type { DiffEntry } from './shapeDiff';

export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

export interface ImpactEntry {
  path: string;
  change: string;
  level: ImpactLevel;
  reason: string;
}

export interface ImpactReport {
  entries: ImpactEntry[];
  summary: Record<ImpactLevel, number>;
  overallLevel: ImpactLevel;
}

const LEVEL_ORDER: ImpactLevel[] = ['critical', 'high', 'medium', 'low', 'none'];

export function classifyImpact(entry: DiffEntry): ImpactEntry {
  const { path, change } = entry;

  if (change === 'removed') {
    return { path, change, level: 'critical', reason: 'Field removed — consumers will break' };
  }
  if (change === 'type-changed') {
    return { path, change, level: 'high', reason: 'Type changed — consumers may misparse' };
  }
  if (change === 'added' && path.includes('required')) {
    return { path, change, level: 'high', reason: 'Required field added — older clients may omit it' };
  }
  if (change === 'added') {
    return { path, change, level: 'low', reason: 'New optional field — additive change' };
  }
  if (change === 'nullable-changed') {
    return { path, change, level: 'medium', reason: 'Nullability changed — consumers should guard' };
  }

  return { path, change, level: 'none', reason: 'No consumer impact expected' };
}

export function assessImpact(entries: DiffEntry[]): ImpactReport {
  const impactEntries = entries.map(classifyImpact);

  const summary: Record<ImpactLevel, number> = {
    critical: 0, high: 0, medium: 0, low: 0, none: 0,
  };
  for (const e of impactEntries) summary[e.level]++;

  const overallLevel = LEVEL_ORDER.find(l => summary[l] > 0) ?? 'none';

  return { entries: impactEntries, summary, overallLevel };
}

export function formatImpactReport(report: ImpactReport): string {
  const lines: string[] = [];
  lines.push(`Overall impact: ${report.overallLevel.toUpperCase()}`);
  lines.push('');

  for (const level of LEVEL_ORDER) {
    const group = report.entries.filter(e => e.level === level);
    if (group.length === 0) continue;
    lines.push(`[${level.toUpperCase()}] (${group.length})`);
    for (const e of group) {
      lines.push(`  ${e.path}  (${e.change})  — ${e.reason}`);
    }
  }

  lines.push('');
  lines.push('Summary:');
  for (const level of LEVEL_ORDER) {
    if (report.summary[level] > 0) {
      lines.push(`  ${level}: ${report.summary[level]}`);
    }
  }

  return lines.join('\n');
}
