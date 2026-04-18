/**
 * diffFilter.ts
 * Utilities for filtering diff results by change type or path pattern.
 */

export type ChangeType = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffEntry {
  path: string;
  changeType: ChangeType;
  left?: string;
  right?: string;
}

export interface FilterOptions {
  types?: ChangeType[];
  pathPattern?: string;
  excludeUnchanged?: boolean;
}

/**
 * Filter diff entries by change type and/or path pattern.
 */
export function filterDiff(entries: DiffEntry[], options: FilterOptions): DiffEntry[] {
  const { types, pathPattern, excludeUnchanged = false } = options;

  return entries.filter((entry) => {
    if (excludeUnchanged && entry.changeType === 'unchanged') {
      return false;
    }

    if (types && types.length > 0 && !types.includes(entry.changeType)) {
      return false;
    }

    if (pathPattern) {
      const regex = globToRegex(pathPattern);
      if (!regex.test(entry.path)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Convert a simple glob pattern (supports * and ?) to a RegExp.
 */
export function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

/**
 * Summarise a filtered list of entries by change type counts.
 */
export function summariseDiff(entries: DiffEntry[]): Record<ChangeType, number> {
  const summary: Record<ChangeType, number> = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  for (const entry of entries) {
    summary[entry.changeType]++;
  }
  return summary;
}
