/**
 * diffNormalize.ts
 * Normalize diff entries by applying key transformations such as
 * trimming whitespace, lowercasing keys, or stripping numeric indices
 * from path segments — useful before comparison or export.
 */

export interface NormalizeOptions {
  lowercaseKeys?: boolean;
  stripArrayIndices?: boolean;
  trimWhitespace?: boolean;
}

const DEFAULT_OPTIONS: NormalizeOptions = {
  lowercaseKeys: true,
  stripArrayIndices: true,
  trimWhitespace: true,
};

/** Replace `[0]`, `[1]`, etc. with `[*]` in a path string. */
export function stripArrayIndices(path: string): string {
  return path.replace(/\[\d+\]/g, '[*]');
}

/** Normalize a single path segment string. */
export function normalizePath(path: string, opts: NormalizeOptions = DEFAULT_OPTIONS): string {
  let result = path;
  if (opts.trimWhitespace) result = result.trim();
  if (opts.stripArrayIndices) result = stripArrayIndices(result);
  if (opts.lowercaseKeys) result = result.toLowerCase();
  return result;
}

export interface DiffEntry {
  path: string;
  type: string;
  [key: string]: unknown;
}

/** Normalize an array of diff entries, deduplicating by normalized path. */
export function normalizeDiff(
  entries: DiffEntry[],
  opts: NormalizeOptions = DEFAULT_OPTIONS
): DiffEntry[] {
  const seen = new Set<string>();
  const result: DiffEntry[] = [];

  for (const entry of entries) {
    const normalizedPath = normalizePath(entry.path, opts);
    const dedupKey = `${normalizedPath}::${entry.type}`;

    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    result.push({ ...entry, path: normalizedPath });
  }

  return result;
}

/** Format a summary of normalization results. */
export function formatNormalizeSummary(before: number, after: number): string {
  const removed = before - after;
  return [
    `Normalized ${before} entr${before === 1 ? 'y' : 'ies'}.`,
    removed > 0 ? `Removed ${removed} duplicate${removed === 1 ? '' : 's'} after normalization.` : 'No duplicates removed.',
  ].join(' ');
}
