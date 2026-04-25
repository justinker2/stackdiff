/**
 * diffSegment.ts
 * Segment diff entries by path prefix up to a given depth.
 * Useful for summarising large diffs by top-level namespace.
 */

import type { DiffEntry } from './diffFilter';

export interface SegmentSummary {
  segment: string;
  added: number;
  removed: number;
  changed: number;
  total: number;
}

/** Extract the leading path segment(s) up to `depth` levels. */
export function segmentPath(path: string, depth: number): string {
  const parts = path.split('.');
  return parts.slice(0, Math.max(1, depth)).join('.');
}

/** Group diff entries into segment summaries. */
export function segmentDiff(
  entries: DiffEntry[],
  depth = 1
): Map<string, SegmentSummary> {
  const map = new Map<string, SegmentSummary>();

  for (const entry of entries) {
    const seg = segmentPath(entry.path, depth);
    if (!map.has(seg)) {
      map.set(seg, { segment: seg, added: 0, removed: 0, changed: 0, total: 0 });
    }
    const summary = map.get(seg)!;
    summary.total += 1;
    if (entry.change === 'added') summary.added += 1;
    else if (entry.change === 'removed') summary.removed += 1;
    else summary.changed += 1;
  }

  return map;
}

/** Format segment summaries as a human-readable report. */
export function formatSegmentReport(map: Map<string, SegmentSummary>): string {
  if (map.size === 0) return 'No segments found.';

  const rows = [...map.values()].sort((a, b) => b.total - a.total);
  const header = 'SEGMENT REPORT\n' + '='.repeat(50);
  const lines = rows.map(
    (r) =>
      `  ${r.segment.padEnd(30)} ` +
      `+${r.added} -${r.removed} ~${r.changed}  (${r.total} total)`
  );

  return [header, ...lines].join('\n');
}
