/**
 * diffFlatten – collapse deeply nested diff paths into a flat summary,
 * optionally truncating at a given depth.
 */

import type { DiffEntry } from './diffCache';

export interface FlatEntry {
  path: string;
  change: string;
  depth: number;
  leaf: string;
}

export interface FlattenOptions {
  maxDepth?: number; // collapse paths deeper than this
  separator?: string; // default '.'
}

export function pathDepth(path: string, sep = '.'): number {
  return path.split(sep).length;
}

export function leafSegment(path: string, sep = '.'): string {
  const parts = path.split(sep);
  return parts[parts.length - 1];
}

export function truncateToDepth(path: string, maxDepth: number, sep = '.'): string {
  const parts = path.split(sep);
  return parts.slice(0, maxDepth).join(sep);
}

export function flattenDiff(entries: DiffEntry[], opts: FlattenOptions = {}): FlatEntry[] {
  const sep = opts.separator ?? '.';
  const maxDepth = opts.maxDepth;

  const seen = new Map<string, FlatEntry>();

  for (const entry of entries) {
    const depth = pathDepth(entry.path, sep);
    const displayPath =
      maxDepth !== undefined && depth > maxDepth
        ? truncateToDepth(entry.path, maxDepth, sep) + sep + '…'
        : entry.path;

    if (!seen.has(displayPath)) {
      seen.set(displayPath, {
        path: displayPath,
        change: entry.change,
        depth: Math.min(depth, maxDepth ?? depth),
        leaf: leafSegment(displayPath, sep),
      });
    }
  }

  return Array.from(seen.values());
}

export function formatFlattenReport(flat: FlatEntry[]): string {
  if (flat.length === 0) return 'No entries after flattening.';
  const lines = flat.map(
    (e) => `  [${'depth:' + e.depth}] ${e.path} (${e.change})`
  );
  return `Flattened diff (${flat.length} unique paths):\n${lines.join('\n')}`;
}
