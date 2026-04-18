import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadHistory,
  appendHistory,
  clearHistory,
  formatHistoryEntry,
  HistoryEntry,
} from './diffHistory';

const HISTORY_FILE = path.join(os.homedir(), '.stackdiff', 'history.json');

const makeEntry = (id: string): HistoryEntry => ({
  id,
  timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
  urlA: 'https://api.example.com/v1/users',
  urlB: 'https://api.example.com/v2/users',
  added: 2,
  removed: 1,
  changed: 3,
  cacheKey: `cache-${id}`,
});

beforeEach(() => {
  clearHistory();
});

afterAll(() => {
  clearHistory();
});

describe('loadHistory', () => {
  it('returns empty array when no history exists', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('returns entries after appending', () => {
    appendHistory(makeEntry('1'));
    appendHistory(makeEntry('2'));
    const history = loadHistory();
    expect(history).toHaveLength(2);
    expect(history[0].id).toBe('1');
  });
});

describe('appendHistory', () => {
  it('persists entry to disk', () => {
    appendHistory(makeEntry('abc'));
    expect(fs.existsSync(HISTORY_FILE)).toBe(true);
    const history = loadHistory();
    expect(history[0].cacheKey).toBe('cache-abc');
  });

  it('trims history to last 100 entries', () => {
    for (let i = 0; i < 105; i++) {
      appendHistory(makeEntry(String(i)));
    }
    const history = loadHistory();
    expect(history).toHaveLength(100);
    expect(history[0].id).toBe('5');
  });
});

describe('formatHistoryEntry', () => {
  it('includes urls and change counts', () => {
    const entry = makeEntry('x');
    const output = formatHistoryEntry(entry);
    expect(output).toContain('api.example.com/v1/users');
    expect(output).toContain('+2 added');
    expect(output).toContain('-1 removed');
    expect(output).toContain('~3 changed');
  });
});
