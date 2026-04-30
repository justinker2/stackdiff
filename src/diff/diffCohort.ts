/**
 * diffCohort: group diff entries into cohorts based on change frequency
 * and surface cohort-level summaries.
 */

import type { DiffEntry } from './diffFilter';

export interface CohortBucket {
  label: string;
  minCount: number;
  maxCount: number;
  entries: DiffEntry[];
}

export interface CohortReport {
  buckets: CohortBucket[];
  total: number;
}

const DEFAULT_BUCKETS: Array<Omit<CohortBucket, 'entries'>> = [
  { label: 'rare',     minCount: 1,  maxCount: 1  },
  { label: 'uncommon', minCount: 2,  maxCount: 5  },
  { label: 'common',   minCount: 6,  maxCount: 20 },
  { label: 'frequent', minCount: 21, maxCount: Infinity },
];

export function buildFrequencyMap(entries: DiffEntry[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const e of entries) {
    freq.set(e.path, (freq.get(e.path) ?? 0) + 1);
  }
  return freq;
}

export function cohortDiff(
  entries: DiffEntry[],
  bucketDefs = DEFAULT_BUCKETS,
): CohortReport {
  const freq = buildFrequencyMap(entries);

  const buckets: CohortBucket[] = bucketDefs.map(b => ({ ...b, entries: [] }));

  for (const e of entries) {
    const count = freq.get(e.path) ?? 1;
    const bucket = buckets.find(b => count >= b.minCount && count <= b.maxCount);
    if (bucket) bucket.entries.push(e);
  }

  return { buckets: buckets.filter(b => b.entries.length > 0), total: entries.length };
}

export function formatCohortReport(report: CohortReport): string {
  if (report.total === 0) return 'No entries to cohort.';

  const lines: string[] = [`Cohort report (${report.total} entries):`];
  for (const b of report.buckets) {
    const pct = ((b.entries.length / report.total) * 100).toFixed(1);
    lines.push(`  [${b.label}]  ${b.entries.length} entries (${pct}%)`);
    const sample = [...new Set(b.entries.map(e => e.path))].slice(0, 3);
    for (const p of sample) lines.push(`    - ${p}`);
    if (new Set(b.entries.map(e => e.path)).size > 3) lines.push('    ...');
  }
  return lines.join('\n');
}
