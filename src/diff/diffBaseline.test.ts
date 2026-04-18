import * as fs from 'fs';
import * as path from 'path';
import {
  saveBaseline,
  loadBaseline,
  deleteBaseline,
  listBaselines,
  compareToBaseline,
} from './diffBaseline';
import { DiffEntry } from './diffCache';

const BASELINE_DIR = path.join(process.cwd(), '.stackdiff', 'baselines');

const entry = (p: string, type: string): DiffEntry => ({
  path: p,
  type: type as DiffEntry['type'],
  baseValue: 'string',
  compareValue: 'number',
});

beforeEach(() => {
  if (fs.existsSync(BASELINE_DIR)) {
    fs.readdirSync(BASELINE_DIR).forEach(f => fs.unlinkSync(path.join(BASELINE_DIR, f)));
  }
});

test('saveBaseline and loadBaseline round-trip', () => {
  const entries = [entry('a.b', 'changed')];
  saveBaseline('test', entries);
  const loaded = loadBaseline('test');
  expect(loaded.name).toBe('test');
  expect(loaded.entries).toHaveLength(1);
  expect(loaded.entries[0].path).toBe('a.b');
});

test('loadBaseline throws for missing baseline', () => {
  expect(() => loadBaseline('nonexistent')).toThrow("Baseline 'nonexistent' not found");
});

test('deleteBaseline removes file and returns true', () => {
  saveBaseline('todelete', []);
  expect(deleteBaseline('todelete')).toBe(true);
  expect(deleteBaseline('todelete')).toBe(false);
});

test('listBaselines returns saved names', () => {
  saveBaseline('alpha', []);
  saveBaseline('beta', []);
  const list = listBaselines();
  expect(list).toContain('alpha');
  expect(list).toContain('beta');
});

test('compareToBaseline identifies added and removed entries', () => {
  const base = [entry('x.y', 'changed'), entry('a.b', 'removed')];
  saveBaseline('cmp', base);
  const current = [entry('x.y', 'changed'), entry('z.w', 'added')];
  const result = compareToBaseline('cmp', current);
  expect(result.added.map(e => e.path)).toContain('z.w');
  expect(result.removed.map(e => e.path)).toContain('a.b');
  expect(result.unchanged.map(e => e.path)).toContain('x.y');
});
