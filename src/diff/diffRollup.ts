import type { DiffEntry } from './diffFilter';

export interface RollupBucket {
  prefix: string;
  added: number;
  removed: number;
  changed: number;
  total: number;
}

export interface RollupResult {
  buckets: RollupBucket[];
  depth: number;
}

/**
 * Truncate a dot-separated path to `depth` segments.
 */
export function truncatePath(path: string, depth: number): string {
  return path.split('.').slice(0, depth).join('.');
}

/**
 * Roll up diff entries by grouping paths to a given prefix depth.
 */
export function rollupDiff(entries: DiffEntry[], depth: number = 2): RollupResult {
  const map = new Map<string, RollupBucket>();

  for (const entry of entries) {
    const prefix = truncatePath(entry.path, depth) || '(root)';

    if (!map.has(prefix)) {
      map.set(prefix, { prefix, added: 0, removed: 0, changed: 0, total: 0 });
    }

    const bucket = map.get(prefix)!;
    bucket.total += 1;

    if (entry.change === 'added') bucket.added += 1;
    else if (entry.change === 'removed') bucket.removed += 1;
    else bucket.changed += 1;
  }

  const buckets = Array.from(map.values()).sort((a, b) =>
    a.prefix.localeCompare(b.prefix)
  );

  return { buckets, depth };
}

export function formatRollupReport(result: RollupResult): string {
  if (result.buckets.length === 0) return 'No differences to roll up.';

  const header = `Rollup at depth ${result.depth}:`;
  const rows = result.buckets.map((b) => {
    const parts: string[] = [];
    if (b.added) parts.push(`+${b.added} added`);
    if (b.removed) parts.push(`-${b.removed} removed`);
    if (b.changed) parts.push(`~${b.changed} changed`);
    return `  ${b.prefix.padEnd(40)} ${parts.join(', ')} (${b.total} total)`;
  });

  return [header, ...rows].join('\n');
}
