import { buildPatch, applyPatch, formatPatch } from './diffPatch';
import { DiffEntry } from './diffFilter';

const entries: DiffEntry[] = [
  { key: 'user.name', change: 'added', type: 'string' },
  { key: 'user.age', change: 'removed', type: 'number' },
  { key: 'user.id', change: 'changed', type: 'string', previousType: 'number' },
];

describe('buildPatch', () => {
  it('creates an operation for each entry', () => {
    const patch = buildPatch(entries);
    expect(patch.operations).toHaveLength(3);
    expect(patch.generated).toBeTruthy();
  });

  it('maps added entries to add ops', () => {
    const patch = buildPatch([entries[0]]);
    expect(patch.operations[0]).toMatchObject({ op: 'add', path: 'user.name', type: 'string' });
  });

  it('maps removed entries to remove ops', () => {
    const patch = buildPatch([entries[1]]);
    expect(patch.operations[0]).toMatchObject({ op: 'remove', path: 'user.age' });
  });

  it('maps changed entries to replace ops', () => {
    const patch = buildPatch([entries[2]]);
    expect(patch.operations[0]).toMatchObject({
      op: 'replace',
      path: 'user.id',
      type: 'string',
      previousType: 'number',
    });
  });
});

describe('applyPatch', () => {
  const base: Record<string, string> = { 'user.age': 'number', 'user.id': 'number' };

  it('adds new keys', () => {
    const patch = buildPatch([entries[0]]);
    const result = applyPatch(base, patch);
    expect(result['user.name']).toBe('string');
  });

  it('removes keys', () => {
    const patch = buildPatch([entries[1]]);
    const result = applyPatch(base, patch);
    expect(result['user.age']).toBeUndefined();
  });

  it('replaces key types', () => {
    const patch = buildPatch([entries[2]]);
    const result = applyPatch(base, patch);
    expect(result['user.id']).toBe('string');
  });
});

describe('formatPatch', () => {
  it('includes generated timestamp', () => {
    const patch = buildPatch(entries);
    const out = formatPatch(patch);
    expect(out).toContain('Patch generated:');
  });

  it('formats add, remove and replace lines', () => {
    const patch = buildPatch(entries);
    const out = formatPatch(patch);
    expect(out).toContain('+ user.name');
    expect(out).toContain('- user.age');
    expect(out).toContain('~ user.id');
  });
});
