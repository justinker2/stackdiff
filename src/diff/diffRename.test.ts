import { detectRenames, formatRenameReport, RenameResult } from './diffRename';
import { DiffEntry } from './diffFilter';

function entry(path: string, change: 'added' | 'removed' | 'changed', type = 'string'): DiffEntry {
  return { path, change, type };
}

describe('detectRenames', () => {
  it('matches a simple rename within the same parent', () => {
    const entries = [
      entry('user.firstName', 'removed'),
      entry('user.first_name', 'added'),
    ];
    const result = detectRenames(entries);
    expect(result.renames).toHaveLength(1);
    expect(result.renames[0]).toEqual({ oldPath: 'user.firstName', newPath: 'user.first_name', type: 'string' });
    expect(result.unmatchedAdded).toHaveLength(0);
    expect(result.unmatchedRemoved).toHaveLength(0);
  });

  it('does not match fields with different types', () => {
    const entries = [
      entry('user.age', 'removed', 'number'),
      entry('user.age', 'added', 'string'),
    ];
    const result = detectRenames(entries);
    expect(result.renames).toHaveLength(0);
    expect(result.unmatchedAdded).toHaveLength(1);
    expect(result.unmatchedRemoved).toHaveLength(1);
  });

  it('does not match fields with different parents', () => {
    const entries = [
      entry('user.name', 'removed'),
      entry('profile.name', 'added'),
    ];
    const result = detectRenames(entries);
    expect(result.renames).toHaveLength(0);
  });

  it('returns empty when no entries', () => {
    const result = detectRenames([]);
    expect(result.renames).toHaveLength(0);
    expect(result.unmatchedAdded).toHaveLength(0);
    expect(result.unmatchedRemoved).toHaveLength(0);
  });

  it('ignores changed entries', () => {
    const entries = [entry('user.name', 'changed')];
    const result = detectRenames(entries);
    expect(result.renames).toHaveLength(0);
  });

  it('handles multiple renames', () => {
    const entries = [
      entry('data.foo', 'removed'),
      entry('data.bar', 'removed'),
      entry('data.foo2', 'added'),
      entry('data.bar2', 'added'),
    ];
    const result = detectRenames(entries);
    expect(result.renames).toHaveLength(2);
  });
});

describe('formatRenameReport', () => {
  it('reports no renames when empty', () => {
    const result: RenameResult = { renames: [], unmatchedAdded: [], unmatchedRemoved: [] };
    expect(formatRenameReport(result)).toContain('No renames detected.');
  });

  it('formats renames with arrow notation', () => {
    const result: RenameResult = {
      renames: [{ oldPath: 'a.x', newPath: 'a.y', type: 'string' }],
      unmatchedAdded: [],
      unmatchedRemoved: [],
    };
    const out = formatRenameReport(result);
    expect(out).toContain('a.x  →  a.y');
    expect(out).toContain('(string)');
  });
});
