import type { DiffEntry } from './shapeDiff';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

function shapeLabel(node: import('./shapeDiff').ShapeNode | null): string {
  if (!node) return 'n/a';
  switch (node.kind) {
    case 'primitive': return node.type;
    case 'object': return 'object';
    case 'array': return `array<${shapeLabel(node.items)}>`;
    case 'null': return 'null';
    case 'unknown': return 'unknown';
  }
}

function colorForChange(change: DiffEntry['change']): string {
  switch (change) {
    case 'added': return COLORS.green;
    case 'removed': return COLORS.red;
    case 'type_changed': return COLORS.yellow;
  }
}

export function formatDiff(entries: DiffEntry[], useColor = true): string {
  if (entries.length === 0) {
    return useColor
      ? `${COLORS.bold}No differences found.${COLORS.reset}`
      : 'No differences found.';
  }

  const lines: string[] = [];

  for (const entry of entries) {
    const color = useColor ? colorForChange(entry.change) : '';
    const reset = useColor ? COLORS.reset : '';
    const tag = entry.change.toUpperCase().padEnd(12);
    const detail =
      entry.change === 'type_changed'
        ? `${shapeLabel(entry.left)} → ${shapeLabel(entry.right)}`
        : shapeLabel(entry.left ?? entry.right);
    lines.push(`${color}${tag}${reset} ${entry.path}  (${detail})`);
  }

  return lines.join('\n');
}
