/**
 * diffSample.ts — randomly or deterministically sample a subset of diff entries
 */

import type { DiffEntry } from './shapeDiff';

export interface SampleOptions {
  /** Number of entries to return (default: 10) */
  count?: number;
  /** If provided, seed the pseudo-random selection for reproducibility */
  seed?: number;
  /** Only sample entries matching this change type */
  changeType?: 'added' | 'removed' | 'changed';
}

/** Simple seeded LCG pseudo-random number generator (0..1) */
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function sampleDiff(
  entries: DiffEntry[],
  options: SampleOptions = {}
): DiffEntry[] {
  const { count = 10, seed, changeType } = options;

  let pool = changeType
    ? entries.filter((e) => e.change === changeType)
    : [...entries];

  if (pool.length <= count) return pool;

  const rand = seed !== undefined ? seededRandom(seed) : Math.random;

  // Fisher-Yates partial shuffle to pick `count` items
  const result: DiffEntry[] = [];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rand() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
    result.push(pool[i]);
  }
  return result;
}

export function formatSampleReport(entries: DiffEntry[], total: number): string {
  const lines: string[] = [
    `Sample: ${entries.length} of ${total} entries`,
    '',
  ];
  for (const e of entries) {
    const tag = e.change === 'added' ? '+' : e.change === 'removed' ? '-' : '~';
    lines.push(`  [${tag}] ${e.path}  ${e.before ?? '(none)'} → ${e.after ?? '(none)'}`);
  }
  return lines.join('\n');
}
