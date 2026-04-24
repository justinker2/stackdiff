/**
 * diffSimilarity.ts
 * Computes a similarity score between two diff result sets,
 * useful for detecting near-identical API responses across environments.
 */

import type { DiffEntry } from "./shapeDiff";

export interface SimilarityResult {
  score: number; // 0.0 – 1.0
  matchedPaths: string[];
  onlyInA: string[];
  onlyInB: string[];
}

/** Return the set of unique paths from a list of DiffEntries. */
export function pathSet(entries: DiffEntry[]): Set<string> {
  return new Set(entries.map((e) => e.path));
}

/**
 * Compute Jaccard similarity between two sets of diff paths.
 * score = |intersection| / |union|
 */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter((p) => b.has(p));
  const union = new Set([...a, ...b]);
  return intersection.length / union.size;
}

/**
 * Compare two arrays of DiffEntry and return a SimilarityResult.
 */
export function compareSimilarity(
  entriesA: DiffEntry[],
  entriesB: DiffEntry[]
): SimilarityResult {
  const setA = pathSet(entriesA);
  const setB = pathSet(entriesB);

  const matchedPaths = [...setA].filter((p) => setB.has(p));
  const onlyInA = [...setA].filter((p) => !setB.has(p));
  const onlyInB = [...setB].filter((p) => !setA.has(p));
  const score = jaccardSimilarity(setA, setB);

  return { score, matchedPaths, onlyInA, onlyInB };
}

/** Format a SimilarityResult as a human-readable string. */
export function formatSimilarity(result: SimilarityResult): string {
  const pct = (result.score * 100).toFixed(1);
  const lines: string[] = [
    `Similarity score : ${pct}%`,
    `Matched paths    : ${result.matchedPaths.length}`,
    `Only in A        : ${result.onlyInA.length}`,
    `Only in B        : ${result.onlyInB.length}`,
  ];
  if (result.onlyInA.length > 0) {
    lines.push("", "Paths only in A:");
    result.onlyInA.forEach((p) => lines.push(`  - ${p}`));
  }
  if (result.onlyInB.length > 0) {
    lines.push("", "Paths only in B:");
    result.onlyInB.forEach((p) => lines.push(`  - ${p}`));
  }
  return lines.join("\n");
}
