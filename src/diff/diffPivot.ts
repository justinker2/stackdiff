/**
 * diffPivot: pivot diff entries by a chosen key dimension (e.g. "type", "path", "severity")
 * producing a cross-tabulation summary useful for reporting.
 */

import type { DiffEntry } from './diffFilter';

export type PivotDimension = 'type' | 'path' | 'severity';

export interface PivotCell {
  count: number;
  paths: string[];
}

export type PivotTable = Record<string, Record<string, PivotCell>>;

/**
 * Build a pivot table from diff entries.
 * Rows = unique values of `rowDim`, Columns = unique values of `colDim`.
 */
export function pivotDiff(
  entries: DiffEntry[],
  rowDim: PivotDimension,
  colDim: PivotDimension
): PivotTable {
  const table: PivotTable = {};

  for (const entry of entries) {
    const rowKey = resolveDimension(entry, rowDim);
    const colKey = resolveDimension(entry, colDim);

    if (!table[rowKey]) table[rowKey] = {};
    if (!table[rowKey][colKey]) table[rowKey][colKey] = { count: 0, paths: [] };

    table[rowKey][colKey].count += 1;
    if (!table[rowKey][colKey].paths.includes(entry.path)) {
      table[rowKey][colKey].paths.push(entry.path);
    }
  }

  return table;
}

function resolveDimension(entry: DiffEntry, dim: PivotDimension): string {
  switch (dim) {
    case 'type':
      return entry.change ?? 'unknown';
    case 'path': {
      const parts = entry.path.split('.');
      return parts[0] ?? entry.path;
    }
    case 'severity':
      return (entry as any).severity ?? 'none';
    default:
      return 'unknown';
  }
}

export function formatPivotTable(
  table: PivotTable,
  rowDim: PivotDimension,
  colDim: PivotDimension
): string {
  const rows = Object.keys(table).sort();
  if (rows.length === 0) return 'No data to pivot.';

  const cols = Array.from(
    new Set(rows.flatMap((r) => Object.keys(table[r])))
  ).sort();

  const colWidth = 10;
  const rowLabel = `${rowDim} \ ${colDim}`;
  const header = [rowLabel.padEnd(20), ...cols.map((c) => c.padStart(colWidth))].join('  ');
  const separator = '-'.repeat(header.length);

  const lines: string[] = [header, separator];

  for (const row of rows) {
    const cells = cols.map((col) => {
      const cell = table[row][col];
      return (cell ? String(cell.count) : '0').padStart(colWidth);
    });
    lines.push([row.padEnd(20), ...cells].join('  '));
  }

  return lines.join('\n');
}
