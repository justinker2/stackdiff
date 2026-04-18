import type { DiffEntry } from './diffAnnotate';

export interface DiffStats {
  total: number;
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
  addedPaths: string[];
  removedPaths: string[];
  changedPaths: string[];
}

export function computeStats(entries: DiffEntry[]): DiffStats {
  const stats: DiffStats = {
    total: entries.length,
    added: 0,
    removed: 0,
    changed: 0,
    unchanged: 0,
    addedPaths: [],
    removedPaths: [],
    changedPaths: [],
  };

  for (const entry of entries) {
    switch (entry.change) {
      case 'added':
        stats.added++;
        stats.addedPaths.push(entry.path);
        break;
      case 'removed':
        stats.removed++;
        stats.removedPaths.push(entry.path);
        break;
      case 'changed':
        stats.changed++;
        stats.changedPaths.push(entry.path);
        break;
      default:
        stats.unchanged++;
    }
  }

  return stats;
}

export function formatStats(stats: DiffStats): string {
  const lines: string[] = [
    `Total fields : ${stats.total}`,
    `  Added      : ${stats.added}`,
    `  Removed    : ${stats.removed}`,
    `  Changed    : ${stats.changed}`,
    `  Unchanged  : ${stats.unchanged}`,
  ];

  if (stats.addedPaths.length)   lines.push(`\nAdded paths:\n  ${stats.addedPaths.join('\n  ')}`);
  if (stats.removedPaths.length) lines.push(`\nRemoved paths:\n  ${stats.removedPaths.join('\n  ')}`);
  if (stats.changedPaths.length) lines.push(`\nChanged paths:\n  ${stats.changedPaths.join('\n  ')}`);

  return lines.join('\n');
}
