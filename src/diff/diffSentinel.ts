/**
 * diffSentinel.ts
 * Detects sentinel / placeholder values in diff entries (e.g. null, "", 0, [], {}).
 * Useful for flagging fields that exist in the shape but carry no real data.
 */

import type { DiffEntry } from './shapeDiff';

export type SentinelKind = 'null' | 'empty-string' | 'zero' | 'empty-array' | 'empty-object';

export interface SentinelMatch {
  path: string;
  side: 'left' | 'right' | 'both';
  kind: SentinelKind;
}

const SENTINEL_CHECKS: Array<{ kind: SentinelKind; test: (v: unknown) => boolean }> = [
  { kind: 'null',         test: (v) => v === null },
  { kind: 'empty-string', test: (v) => v === '' },
  { kind: 'zero',         test: (v) => v === 0 },
  { kind: 'empty-array',  test: (v) => Array.isArray(v) && v.length === 0 },
  { kind: 'empty-object', test: (v) => typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length === 0 },
];

function detectKind(value: unknown): SentinelKind | null {
  for (const { kind, test } of SENTINEL_CHECKS) {
    if (test(value)) return kind;
  }
  return null;
}

export function detectSentinels(entries: DiffEntry[]): SentinelMatch[] {
  const matches: SentinelMatch[] = [];

  for (const entry of entries) {
    const leftKind  = 'leftValue'  in entry ? detectKind((entry as any).leftValue)  : null;
    const rightKind = 'rightValue' in entry ? detectKind((entry as any).rightValue) : null;

    if (leftKind && rightKind && leftKind === rightKind) {
      matches.push({ path: entry.path, side: 'both', kind: leftKind });
    } else {
      if (leftKind)  matches.push({ path: entry.path, side: 'left',  kind: leftKind });
      if (rightKind) matches.push({ path: entry.path, side: 'right', kind: rightKind });
    }
  }

  return matches;
}

export function formatSentinelReport(matches: SentinelMatch[]): string {
  if (matches.length === 0) return 'No sentinel values detected.';

  const lines: string[] = ['Sentinel value report:', ''];
  for (const m of matches) {
    lines.push(`  [${m.side.padEnd(5)}] ${m.path}  →  ${m.kind}`);
  }
  lines.push('');
  lines.push(`Total: ${matches.length} sentinel(s) found.`);
  return lines.join('\n');
}
