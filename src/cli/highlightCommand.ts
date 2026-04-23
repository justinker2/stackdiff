/**
 * highlightCommand.ts
 * CLI sub-command: highlight fields in a saved diff using label rules.
 *
 * Usage:
 *   stackdiff highlight <cache-key> --rule "user.*:PII" --rule "meta.**:META:internal"
 */

import { readCache } from '../diff/diffCache';
import { highlightDiff, formatHighlightReport, HighlightRule } from '../diff/diffHighlight';

export interface HighlightArgs {
  cacheKey: string;
  rules: HighlightRule[];
  json: boolean;
}

export function parseHighlightArgs(argv: string[]): HighlightArgs {
  const args = argv.slice(2);
  const cacheKey = args[0];
  if (!cacheKey) throw new Error('Usage: stackdiff highlight <cache-key> [--rule pattern:label[:note]] [--json]');

  const rules: HighlightRule[] = [];
  let json = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--json') {
      json = true;
    } else if (args[i] === '--rule' && args[i + 1]) {
      const parts = args[++i].split(':');
      if (parts.length < 2) throw new Error(`Invalid rule format: "${args[i]}". Expected pattern:label[:note]`);
      rules.push({ pattern: parts[0], label: parts[1], note: parts[2] });
    }
  }

  if (rules.length === 0) throw new Error('At least one --rule is required.');

  return { cacheKey, rules, json };
}

export async function runHighlightCommand(argv: string[]): Promise<void> {
  const { cacheKey, rules, json } = parseHighlightArgs(argv);

  const cached = await readCache(cacheKey);
  if (!cached) {
    console.error(`No cached diff found for key: ${cacheKey}`);
    process.exit(1);
  }

  const highlighted = highlightDiff(cached.entries, rules);

  if (json) {
    console.log(JSON.stringify(highlighted, null, 2));
  } else {
    console.log(formatHighlightReport(highlighted));
  }
}
