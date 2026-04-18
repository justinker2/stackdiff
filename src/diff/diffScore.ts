/**
 * Computes a numeric similarity score between two diff shapes.
 * Score ranges from 0 (completely different) to 1 (identical).
 */

import { DiffEntry } from './diffFilter';

export interface ScoreResult {
  score: number;
  total: number;
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
}

export function scoreDiff(entries: DiffEntry[]): ScoreResult {
  const total = entries.length;
  if (total === 0) {
    return { score: 1, total: 0, added: 0, removed: 0, changed: 0, unchanged: 0 };
  }

  let added = 0;
  let removed = 0;
  let changed = 0;
  let unchanged = 0;

  for (const entry of entries) {
    switch (entry.change) {
      case 'added':     added++;     break;
      case 'removed':  removed++;   break;
      case 'changed':  changed++;   break;
      case 'unchanged': unchanged++; break;
    }
  }

  const score = parseFloat((unchanged / total).toFixed(4));
  return { score, total, added, removed, changed, unchanged };
}

export function formatScore(result: ScoreResult): string {
  const pct = (result.score * 100).toFixed(1);
  return [
    `Similarity: ${pct}%`,
    `  Total fields : ${result.total}`,
    `  Unchanged    : ${result.unchanged}`,
    `  Added        : ${result.added}`,
    `  Removed      : ${result.removed}`,
    `  Changed      : ${result.changed}`,
  ].join('\n');
}
