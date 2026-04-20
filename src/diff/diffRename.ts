/**
 * diffRename: detect and map field renames between two diff shapes.
 * A rename is inferred when a field is removed on one side and a field with
 * the same value-type is added, sharing a common parent path.
 */

import { DiffEntry } from './diffFilter';

export interface RenameCandidate {
  oldPath: string;
  newPath: string;
  type: string;
}

export interface RenameResult {
  renames: RenameCandidate[];
  unmatchedAdded: DiffEntry[];
  unmatchedRemoved: DiffEntry[];
}

function parentOf(path: string): string {
  const parts = path.split('.');
  return parts.slice(0, -1).join('.');
}

export function detectRenames(entries: DiffEntry[]): RenameResult {
  const removed = entries.filter((e) => e.change === 'removed');
  const added = entries.filter((e) => e.change === 'added');

  const renames: RenameCandidate[] = [];
  const matchedRemoved = new Set<string>();
  const matchedAdded = new Set<string>();

  for (const rem of removed) {
    for (const add of added) {
      if (matchedAdded.has(add.path)) continue;
      if (rem.type !== add.type) continue;
      if (parentOf(rem.path) !== parentOf(add.path)) continue;

      renames.push({ oldPath: rem.path, newPath: add.path, type: rem.type });
      matchedRemoved.add(rem.path);
      matchedAdded.add(add.path);
      break;
    }
  }

  return {
    renames,
    unmatchedAdded: added.filter((e) => !matchedAdded.has(e.path)),
    unmatchedRemoved: removed.filter((e) => !matchedRemoved.has(e.path)),
  };
}

export function formatRenameReport(result: RenameResult): string {
  const lines: string[] = [];

  if (result.renames.length === 0) {
    lines.push('No renames detected.');
  } else {
    lines.push(`Detected ${result.renames.length} rename(s):`);
    for (const r of result.renames) {
      lines.push(`  ${r.oldPath}  →  ${r.newPath}  (${r.type})`);
    }
  }

  if (result.unmatchedRemoved.length) {
    lines.push(`\nUnmatched removals (${result.unmatchedRemoved.length}):`);
    for (const e of result.unmatchedRemoved) {
      lines.push(`  - ${e.path} (${e.type})`);
    }
  }

  if (result.unmatchedAdded.length) {
    lines.push(`\nUnmatched additions (${result.unmatchedAdded.length}):`);
    for (const e of result.unmatchedAdded) {
      lines.push(`  + ${e.path} (${e.type})`);
    }
  }

  return lines.join('\n');
}
