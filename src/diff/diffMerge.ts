import { DiffEntry } from './diffFilter';

export interface MergeResult {
  merged: DiffEntry[];
  conflicts: ConflictEntry[];
}

export interface ConflictEntry {
  path: string;
  base: DiffEntry;
  incoming: DiffEntry;
}

/**
 * Merge two diff sets, preferring `incoming` on conflict.
 * Conflicts are recorded separately for inspection.
 */
export function mergeDiffs(
  base: DiffEntry[],
  incoming: DiffEntry[]
): MergeResult {
  const baseMap = new Map<string, DiffEntry>(base.map((e) => [e.path, e]));
  const incomingMap = new Map<string, DiffEntry>(incoming.map((e) => [e.path, e]));

  const conflicts: ConflictEntry[] = [];
  const merged: DiffEntry[] = [];

  for (const [path, incomingEntry] of incomingMap) {
    const baseEntry = baseMap.get(path);
    if (baseEntry && baseEntry.change !== incomingEntry.change) {
      conflicts.push({ path, base: baseEntry, incoming: incomingEntry });
    }
    merged.push(incomingEntry);
    baseMap.delete(path);
  }

  // Remaining base-only entries
  for (const entry of baseMap.values()) {
    merged.push(entry);
  }

  return { merged, conflicts };
}

export function formatMergeConflicts(conflicts: ConflictEntry[]): string {
  if (conflicts.length === 0) return 'No conflicts.';
  const lines = conflicts.map(
    (c) =>
      `CONFLICT ${c.path}: base=${c.base.change} incoming=${c.incoming.change}`
  );
  return lines.join('\n');
}
