import { pivotDiff, formatPivotTable } from './diffPivot';
import type { DiffEntry } from './diffFilter';

function makeEntry(path: string, change: string, severity?: string): DiffEntry {
  return { path, change, ...(severity ? { severity } : {}) } as any;
}

const entries: DiffEntry[] = [
  makeEntry('user.name', 'added'),
  makeEntry('user.age', 'removed'),
  makeEntry('order.total', 'added'),
  makeEntry('order.id', 'changed'),
  makeEntry('user.email', 'added'),
];

describe('pivotDiff', () => {
  it('pivots by type (row) and path top-level (col)', () => {
    const table = pivotDiff(entries, 'type', 'path');
    expect(table['added']['user'].count).toBe(2);
    expect(table['added']['order'].count).toBe(1);
    expect(table['removed']['user'].count).toBe(1);
    expect(table['changed']['order'].count).toBe(1);
  });

  it('pivots by path (row) and type (col)', () => {
    const table = pivotDiff(entries, 'path', 'type');
    expect(table['user']['added'].count).toBe(2);
    expect(table['user']['removed'].count).toBe(1);
    expect(table['order']['added'].count).toBe(1);
    expect(table['order']['changed'].count).toBe(1);
  });

  it('accumulates unique paths in each cell', () => {
    const table = pivotDiff(entries, 'type', 'path');
    expect(table['added']['user'].paths).toContain('user.name');
    expect(table['added']['user'].paths).toContain('user.email');
    expect(table['added']['user'].paths).not.toContain('order.total');
  });

  it('returns empty table for empty entries', () => {
    const table = pivotDiff([], 'type', 'path');
    expect(Object.keys(table)).toHaveLength(0);
  });

  it('handles missing severity gracefully', () => {
    const table = pivotDiff(entries, 'severity', 'type');
    expect(table['none']).toBeDefined();
    expect(table['none']['added'].count).toBe(3);
  });
});

describe('formatPivotTable', () => {
  it('returns a non-empty string for valid data', () => {
    const table = pivotDiff(entries, 'type', 'path');
    const output = formatPivotTable(table, 'type', 'path');
    expect(output).toContain('added');
    expect(output).toContain('user');
    expect(output).toContain('order');
  });

  it('returns fallback message for empty table', () => {
    const output = formatPivotTable({}, 'type', 'path');
    expect(output).toBe('No data to pivot.');
  });

  it('includes separator line', () => {
    const table = pivotDiff(entries, 'type', 'path');
    const output = formatPivotTable(table, 'type', 'path');
    expect(output).toMatch(/^-+$/m);
  });
});
