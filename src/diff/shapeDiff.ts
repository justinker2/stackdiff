export type ShapeNode =
  | { kind: 'primitive'; type: string }
  | { kind: 'object'; fields: Record<string, ShapeNode> }
  | { kind: 'array'; items: ShapeNode }
  | { kind: 'null' }
  | { kind: 'unknown' };

export interface DiffEntry {
  path: string;
  left: ShapeNode | null;
  right: ShapeNode | null;
  change: 'added' | 'removed' | 'type_changed';
}

export function extractShape(value: unknown): ShapeNode {
  if (value === null) return { kind: 'null' };
  if (Array.isArray(value)) {
    return { kind: 'array', items: value.length > 0 ? extractShape(value[0]) : { kind: 'unknown' } };
  }
  if (typeof value === 'object') {
    const fields: Record<string, ShapeNode> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = extractShape(v);
    }
    return { kind: 'object', fields };
  }
  return { kind: 'primitive', type: typeof value };
}

export function diffShapes(
  left: ShapeNode,
  right: ShapeNode,
  path = '$'
): DiffEntry[] {
  const entries: DiffEntry[] = [];

  if (left.kind !== right.kind) {
    entries.push({ path, left, right, change: 'type_changed' });
    return entries;
  }

  if (left.kind === 'object' && right.kind === 'object') {
    const allKeys = new Set([...Object.keys(left.fields), ...Object.keys(right.fields)]);
    for (const key of allKeys) {
      const childPath = `${path}.${key}`;
      if (!(key in left.fields)) {
        entries.push({ path: childPath, left: null, right: right.fields[key], change: 'added' });
      } else if (!(key in right.fields)) {
        entries.push({ path: childPath, left: left.fields[key], right: null, change: 'removed' });
      } else {
        entries.push(...diffShapes(left.fields[key], right.fields[key], childPath));
      }
    }
  }

  if (left.kind === 'array' && right.kind === 'array') {
    entries.push(...diffShapes(left.items, right.items, `${path}[]`));
  }

  return entries;
}
