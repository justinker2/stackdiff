/**
 * diffHighlight.ts
 * Highlights specific fields in a diff by matching path patterns,
 * attaching a highlight label and optional note to matched entries.
 */

import type { DiffEntry } from './shapeDiff';

export interface HighlightRule {
  pattern: string;
  label: string;
  note?: string;
}

export interface HighlightedEntry extends DiffEntry {
  highlight?: {
    label: string;
    note?: string;
  };
}

export function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^.]*')
    .replace(/\*\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function highlightDiff(
  entries: DiffEntry[],
  rules: HighlightRule[]
): HighlightedEntry[] {
  const compiled = rules.map((r) => ({
    regex: patternToRegex(r.pattern),
    label: r.label,
    note: r.note,
  }));

  return entries.map((entry) => {
    const match = compiled.find((r) => r.regex.test(entry.path));
    if (!match) return entry;
    return {
      ...entry,
      highlight: { label: match.label, note: match.note },
    };
  });
}

export function formatHighlightReport(entries: HighlightedEntry[]): string {
  const highlighted = entries.filter((e) => e.highlight);
  if (highlighted.length === 0) return 'No highlighted fields.';

  const lines: string[] = [`Highlighted fields (${highlighted.length}):`, ''];
  for (const e of highlighted) {
    const note = e.highlight!.note ? `  # ${e.highlight!.note}` : '';
    lines.push(`  [${e.highlight!.label}] ${e.path} (${e.change})${note}`);
  }
  return lines.join('\n');
}
