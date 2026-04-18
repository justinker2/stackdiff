import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  urlA: string;
  urlB: string;
  added: number;
  removed: number;
  changed: number;
  cacheKey: string;
}

const HISTORY_DIR = path.join(os.homedir(), '.stackdiff');
const HISTORY_FILE = path.join(HISTORY_DIR, 'history.json');

export function ensureHistoryDir(): void {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

export function loadHistory(): HistoryEntry[] {
  ensureHistoryDir();
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function appendHistory(entry: HistoryEntry): void {
  ensureHistoryDir();
  const history = loadHistory();
  history.push(entry);
  const trimmed = history.slice(-100);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}

export function clearHistory(): void {
  if (fs.existsSync(HISTORY_FILE)) {
    fs.unlinkSync(HISTORY_FILE);
  }
}

export function formatHistoryEntry(entry: HistoryEntry): string {
  const { timestamp, urlA, urlB, added, removed, changed } = entry;
  const date = new Date(timestamp).toLocaleString();
  return [
    `[${date}]`,
    `  A: ${urlA}`,
    `  B: ${urlB}`,
    `  +${added} added, -${removed} removed, ~${changed} changed`,
  ].join('\n');
}
