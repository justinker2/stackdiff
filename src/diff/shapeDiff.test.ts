import { extractShape, diffShapes } from './shapeDiff';

describe('extractShape', () => {
  it('handles primitives', () => {
    expect(extractShape(42)).toEqual({ kind: 'primitive', type: 'number' });
    expect(extractShape('hi')).toEqual({ kind: 'primitive', type: 'string' });
    expect(extractShape(null)).toEqual({ kind: 'null' });
  });

  it('handles objects', () => {
    const shape = extractShape({ name: 'Alice', age: 30 });
    expect(shape).toEqual({
      kind: 'object',
      fields: {
        name: { kind: 'primitive', type: 'string' },
        age: { kind: 'primitive', type: 'number' },
      },
    });
  });

  it('handles arrays', () => {
    const shape = extractShape([{ id: 1 }]);
    expect(shape).toEqual({
      kind: 'array',
      items: { kind: 'object', fields: { id: { kind: 'primitive', type: 'number' } } },
    });
  });

  it('handles empty arrays', () => {
    const shape = extractShape([]);
    expect(shape).toEqual({ kind: 'array', items: null });
  });

  it('handles nested objects', () => {
    const shape = extractShape({ user: { id: 1, name: 'Alice' } });
    expect(shape).toEqual({
      kind: 'object',
      fields: {
        user: {
          kind: 'object',
          fields: {
            id: { kind: 'primitive', type: 'number' },
            name: { kind: 'primitive', type: 'string' },
          },
        },
      },
    });
  });
});

describe('diffShapes', () => {
  it('detects added fields', () => {
    const left = extractShape({ name: 'Alice' });
    const right = extractShape({ name: 'Alice', age: 30 });
    const diffs = diffShapes(left, right);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ path: '$.age', change: 'added' });
  });

  it('detects removed fields', () => {
    const left = extractShape({ name: 'Alice', age: 30 });
    const right = extractShape({ name: 'Alice' });
    const diffs = diffShapes(left, right);
    expect(diffs[0]).toMatchObject({ path: '$.age', change: 'removed' });
  });

  it('detects type changes', () => {
    const left = extractShape({ id: 1 });
    const right = extractShape({ id: '1' });
    const diffs = diffShapes(left, right);
    expect(diffs[0]).toMatchObject({ path: '$.id', change: 'type_changed' });
  });

  it('returns no diffs for identical shapes', () => {
    const shape = extractShape({ ok: true });
    expect(diffShapes(shape, shape)).toHaveLength(0);
  });

  it('detects changes in nested fields', () => {
    const left = extractShape({ user: { id: 1 } });
    const right = extractShape({ user: { id: '1' } });
    const diffs = diffShapes(left, right);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ path: '$.user.id', change: 'type_changed' });
  });
});
