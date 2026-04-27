/**
 * diffEntropy.ts
 * Measures the Shannon entropy of change types across a diff,
 * giving a single numeric score for how "chaotic" or "uniform" the diff is.
 */

import type { DiffEntry } from './shapeDiff';

export interface EntropyResult {
  total: number;
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  entropy: number;
  normalized: number; // 0–1, relative to max possible entropy for N categories
  label: string;
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

function entropyLabel(normalized: number): string {
  if (normalized >= 0.8) return 'high';
  if (normalized >= 0.4) return 'moderate';
  return 'low';
}

export function computeEntropy(entries: DiffEntry[]): EntropyResult {
  const counts: Record<string, number> = {};

  for (const entry of entries) {
    counts[entry.change] = (counts[entry.change] ?? 0) + 1;
  }

  const total = entries.length;
  const categories = Object.keys(counts);

  if (total === 0) {
    return { total: 0, counts: {}, probabilities: {}, entropy: 0, normalized: 0, label: 'low' };
  }

  const probabilities: Record<string, number> = {};
  let entropy = 0;

  for (const key of categories) {
    const p = counts[key] / total;
    probabilities[key] = round4(p);
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  entropy = round4(entropy);

  const maxEntropy = categories.length > 1 ? Math.log2(categories.length) : 1;
  const normalized = round4(entropy / maxEntropy);

  return {
    total,
    counts,
    probabilities,
    entropy,
    normalized,
    label: entropyLabel(normalized),
  };
}

export function formatEntropyReport(result: EntropyResult): string {
  const lines: string[] = [
    `Entropy Report`,
    `  Total entries : ${result.total}`,
    `  Shannon entropy: ${result.entropy} bits`,
    `  Normalized     : ${(result.normalized * 100).toFixed(1)}% (${result.label})`,
    `  Breakdown:`,
  ];

  for (const [change, count] of Object.entries(result.counts)) {
    const pct = ((result.probabilities[change] ?? 0) * 100).toFixed(1);
    lines.push(`    ${change.padEnd(12)} ${count} (${pct}%)`);
  }

  return lines.join('\n');
}
