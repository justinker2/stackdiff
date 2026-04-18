import { compareResponses } from './index';
import { appendHistory } from './diffHistory';
import { writeCache } from './diffCache';

export interface WatchOptions {
  urlA: string;
  urlB: string;
  headersA?: Record<string, string>;
  headersB?: Record<string, string>;
  intervalMs?: number;
  maxRuns?: number;
  onDiff?: (result: WatchResult) => void;
}

export interface WatchResult {
  timestamp: string;
  hasChanges: boolean;
  added: string[];
  removed: string[];
  changed: string[];
}

export interface WatchHandle {
  stop: () => void;
  runCount: () => number;
}

export function startWatch(options: WatchOptions): WatchHandle {
  const {
    urlA,
    urlB,
    headersA = {},
    headersB = {},
    intervalMs = 30000,
    maxRuns,
    onDiff,
  } = options;

  let count = 0;
  let stopped = false;

  async function run() {
    if (stopped) return;
    count++;

    try {
      const diff = await compareResponses(urlA, urlB, headersA, headersB);
      const timestamp = new Date().toISOString();
      const result: WatchResult = {
        timestamp,
        hasChanges: diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0,
        added: diff.added,
        removed: diff.removed,
        changed: diff.changed,
      };

      if (result.hasChanges) {
        await appendHistory({ urlA, urlB, diff, timestamp });
        await writeCache(urlA, urlB, { diff, timestamp, urlA, urlB });
      }

      onDiff?.(result);
    } catch (err) {
      // swallow per-run errors to keep watch alive
    }

    if (!stopped && (maxRuns === undefined || count < maxRuns)) {
      setTimeout(run, intervalMs);
    }
  }

  setTimeout(run, 0);

  return {
    stop: () => { stopped = true; },
    runCount: () => count,
  };
}
