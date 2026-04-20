/**
 * diffAlias.ts — assign human-readable aliases to diff entries by path pattern
 */

export interface AliasRule {
  pattern: string;
  alias: string;
}

export interface AliasedEntry {
  path: string;
  change: string;
  alias?: string;
}

export function matchAlias(path: string, rules: AliasRule[]): string | undefined {
  for (const rule of rules) {
    const regex = patternToRegex(rule.pattern);
    if (regex.test(path)) {
      return rule.alias;
    }
  }
  return undefined;
}

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

export function aliasDiff(
  entries: Array<{ path: string; change: string }>,
  rules: AliasRule[]
): AliasedEntry[] {
  return entries.map((entry) => ({
    ...entry,
    alias: matchAlias(entry.path, rules),
  }));
}

export function formatAliasReport(entries: AliasedEntry[]): string {
  if (entries.length === 0) return 'No diff entries.';
  const lines = entries.map((e) => {
    const label = e.alias ? `${e.path} (${e.alias})` : e.path;
    return `  ${label}: ${e.change}`;
  });
  return lines.join('\n');
}

export function buildAliasIndex(rules: AliasRule[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const rule of rules) {
    index.set(rule.pattern, rule.alias);
  }
  return index;
}
