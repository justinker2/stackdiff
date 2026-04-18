import * as fs from 'fs';
import * as path from 'path';
import { DiffEntry } from './diffCache';

const BASELINE_DIR = path.join(process.cwd(), '.stackdiff', 'baselines');

export function ensureBaselineDir(): void {
  if (!fs.existsSync(BASELINE_DIR)) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
  }
}

export function baselinePath(name: string): string {
  return path.join(BASELINE_DIR, `${name}.json`);
}

export function saveBaseline(name: string, entries: DiffEntry[]): void {
  ensureBaselineDir();
  fs.writeFileSync(baselinePath(name), JSON.stringify({ name, savedAt: new Date().toISOString(), entries }, null, 2));
}

export interface Baseline {
  name: string;
  savedAt: string;
  entries: DiffEntry[];
}

export function loadBaseline(name: string): Baseline {
  const p = baselinePath(name);
  if (!fs.existsSync(p)) throw new Error(`Baseline '${name}' not found`);
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as Baseline;
}

export function deleteBaseline(name: string): boolean {
  const p = baselinePath(name);
  if (!fs.existsSync(p)) return false;
  fs.unlinkSync(p);
  return true;
}

export function listBaselines(): string[] {
  if (!fs.existsSync(BASELINE_DIR)) return [];
  return fs.readdirSync(BASELINE_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''));
}

export function compareToBaseline(name: string, current: DiffEntry[]): { added: DiffEntry[]; removed: DiffEntry[]; unchanged: DiffEntry[] } {
  const baseline = loadBaseline(name);
  const baselineKeys = new Set(baseline.entries.map(e => `${e.path}:${e.type}`));
  const currentKeys = new Set(current.map(e => `${e.path}:${e.type}`));

  const added = current.filter(e => !baselineKeys.has(`${e.path}:${e.type}`));
  const removed = baseline.entries.filter(e => !currentKeys.has(`${e.path}:${e.type}`));
  const unchanged = current.filter(e => baselineKeys.has(`${e.path}:${e.type}`));

  return { added, removed, unchanged };
}
