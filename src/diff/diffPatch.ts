import { DiffEntry } from './diffFilter';

export interface PatchOperation {
  op: 'add' | 'remove' | 'replace';
  path: string;
  type?: string;
  previousType?: string;
}

export interface Patch {
  generated: string;
  operations: PatchOperation[];
}

export function buildPatch(entries: DiffEntry[]): Patch {
  const operations: PatchOperation[] = entries.map((entry) => {
    if (entry.change === 'added') {
      return { op: 'add', path: entry.key, type: entry.type };
    } else if (entry.change === 'removed') {
      return { op: 'remove', path: entry.key, previousType: entry.type };
    } else {
      return {
        op: 'replace',
        path: entry.key,
        type: entry.type,
        previousType: entry.previousType,
      };
    }
  });

  return {
    generated: new Date().toISOString(),
    operations,
  };
}

export function applyPatch(
  shape: Record<string, string>,
  patch: Patch
): Record<string, string> {
  const result = { ...shape };

  for (const op of patch.operations) {
    if (op.op === 'add' && op.type) {
      result[op.path] = op.type;
    } else if (op.op === 'remove') {
      delete result[op.path];
    } else if (op.op === 'replace' && op.type) {
      result[op.path] = op.type;
    }
  }

  return result;
}

export function formatPatch(patch: Patch): string {
  const lines: string[] = [`Patch generated: ${patch.generated}`, ''];
  for (const op of patch.operations) {
    if (op.op === 'add') {
      lines.push(`  + ${op.path}: ${op.type}`);
    } else if (op.op === 'remove') {
      lines.push(`  - ${op.path}: ${op.previousType}`);
    } else {
      lines.push(`  ~ ${op.path}: ${op.previousType} → ${op.type}`);
    }
  }
  return lines.join('\n');
}
