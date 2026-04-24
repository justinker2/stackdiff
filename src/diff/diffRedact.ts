/**
 * diffRedact.ts
 * Redact sensitive field values in diff entries before display or export.
 */

import type { DiffEntry } from "./shapeDiff";

export interface RedactOptions {
  patterns: string[];
  placeholder?: string;
}

const DEFAULT_PLACEHOLDER = "[REDACTED]";

const BUILT_IN_SENSITIVE = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /ssn/i,
  /credit.?card/i,
];

export function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(escaped, "i");
}

export function shouldRedact(path: string, patterns: RegExp[]): boolean {
  const segment = path.split(".").pop() ?? path;
  return patterns.some((re) => re.test(segment));
}

export function redactEntry(
  entry: DiffEntry,
  patterns: RegExp[],
  placeholder: string
): DiffEntry {
  if (!shouldRedact(entry.path, patterns)) return entry;
  return {
    ...entry,
    previousValue: entry.previousValue !== undefined ? placeholder : undefined,
    currentValue: entry.currentValue !== undefined ? placeholder : undefined,
  };
}

export function redactDiff(
  entries: DiffEntry[],
  options: RedactOptions = { patterns: [] }
): DiffEntry[] {
  const placeholder = options.placeholder ?? DEFAULT_PLACEHOLDER;
  const custom = options.patterns.map(patternToRegex);
  const allPatterns = [...BUILT_IN_SENSITIVE, ...custom];
  return entries.map((e) => redactEntry(e, allPatterns, placeholder));
}

export function formatRedactSummary(original: DiffEntry[], redacted: DiffEntry[]): string {
  let count = 0;
  for (let i = 0; i < original.length; i++) {
    if (
      original[i].previousValue !== redacted[i].previousValue ||
      original[i].currentValue !== redacted[i].currentValue
    ) {
      count++;
    }
  }
  return `Redacted ${count} of ${original.length} field(s).`;
}
