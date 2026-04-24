import { DiffEntry } from './shapeDiff';

export type ChangeClass =
  | 'addition'
  | 'removal'
  | 'type-change'
  | 'structural'
  | 'unknown';

export interface ClassifiedEntry extends DiffEntry {
  changeClass: ChangeClass;
}

export function classifyEntry(entry: DiffEntry): ChangeClass {
  const { change } = entry;

  if (change === 'added') return 'addition';
  if (change === 'removed') return 'removal';

  if (change === 'changed') {
    const from = entry.from ?? '';
    const to = entry.to ?? '';

    const primitives = ['string', 'number', 'boolean', 'null'];
    const fromPrimitive = primitives.includes(from);
    const toPrimitive = primitives.includes(to);

    if (fromPrimitive !== toPrimitive) return 'structural';
    if (from !== to) return 'type-change';
  }

  return 'unknown';
}

export function classifyDiff(entries: DiffEntry[]): ClassifiedEntry[] {
  return entries.map((entry) => ({
    ...entry,
    changeClass: classifyEntry(entry),
  }));
}

export function groupByClass(
  entries: ClassifiedEntry[]
): Record<ChangeClass, ClassifiedEntry[]> {
  const groups: Record<ChangeClass, ClassifiedEntry[]> = {
    addition: [],
    removal: [],
    'type-change': [],
    structural: [],
    unknown: [],
  };
  for (const entry of entries) {
    groups[entry.changeClass].push(entry);
  }
  return groups;
}

export function formatClassifyReport(
  groups: Record<ChangeClass, ClassifiedEntry[]>
): string {
  const lines: string[] = ['=== Classification Report ==='];
  for (const [cls, items] of Object.entries(groups) as [ChangeClass, ClassifiedEntry[]][]) {
    if (items.length === 0) continue;
    lines.push(`\n[${cls.toUpperCase()}] (${items.length})`);
    for (const item of items) {
      const detail =
        item.from && item.to ? ` (${item.from} → ${item.to})` : '';
      lines.push(`  ${item.path}${detail}`);
    }
  }
  return lines.join('\n');
}
