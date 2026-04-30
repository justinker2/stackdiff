/**
 * diffCorrelate: find paths that change together across multiple diffs.
 * Two paths are "correlated" when they appear in the same diff entries
 * above a configurable co-occurrence threshold.
 */

import type { DiffEntry } from './diffFilter';

export interface CorrelationPair {
  pathA: string;
  pathB: string;
  coOccurrences: number;
  correlation: number; // 0-1 Jaccard coefficient
}

export interface CorrelationReport {
  pairs: CorrelationPair[];
  totalPaths: number;
}

/** Build a map of path -> set of diff-group indices where it appears. */
function buildPresenceMap(groups: DiffEntry[][]): Map<string, Set<number>> {
  const presence = new Map<string, Set<number>>();
  groups.forEach((entries, idx) => {
    for (const e of entries) {
      if (!presence.has(e.path)) presence.set(e.path, new Set());
      presence.get(e.path)!.add(idx);
    }
  });
  return presence;
}

/** Jaccard similarity between two sets. */
function jaccard(a: Set<number>, b: Set<number>): number {
  let intersection = 0;
  for (const v of a) if (b.has(v)) intersection++;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

export function correlateDiff(
  groups: DiffEntry[][],
  minCorrelation = 0.5,
  minCoOccurrences = 2
): CorrelationReport {
  const presence = buildPresenceMap(groups);
  const paths = Array.from(presence.keys());
  const pairs: CorrelationPair[] = [];

  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      const setA = presence.get(paths[i])!;
      const setB = presence.get(paths[j])!;
      let coOccurrences = 0;
      for (const v of setA) if (setB.has(v)) coOccurrences++;
      if (coOccurrences < minCoOccurrences) continue;
      const correlation = jaccard(setA, setB);
      if (correlation >= minCorrelation) {
        pairs.push({ pathA: paths[i], pathB: paths[j], coOccurrences, correlation });
      }
    }
  }

  pairs.sort((a, b) => b.correlation - a.correlation);
  return { pairs, totalPaths: paths.length };
}

export function formatCorrelateReport(report: CorrelationReport): string {
  if (report.pairs.length === 0) {
    return `No correlated paths found (${report.totalPaths} total paths).`;
  }
  const lines: string[] = [
    `Correlated paths (${report.pairs.length} pairs, ${report.totalPaths} total paths):`,
  ];
  for (const p of report.pairs) {
    const pct = (p.correlation * 100).toFixed(1);
    lines.push(`  ${p.pathA}  <->  ${p.pathB}  [${pct}%, ${p.coOccurrences} co-occurrences]`);
  }
  return lines.join('\n');
}
