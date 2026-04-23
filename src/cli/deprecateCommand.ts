/**
 * CLI command: stackdiff deprecate
 * Runs deprecation detection against a cached or live diff.
 */

import { findDeprecations, formatDeprecationReport, type DeprecationRule } from '../diff/diffDeprecate';
import { getDeprecationProfile } from '../config/deprecationProfile';
import type { DiffEntry } from '../diff/shapeDiff';

export interface DeprecateArgs {
  profile: string;
  rules: DeprecationRule[];
  json: boolean;
}

export function parseDeprecateArgs(argv: string[]): DeprecateArgs {
  const args: DeprecateArgs = { profile: '', rules: [], json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--profile' || arg === '-p') {
      args.profile = argv[++i] ?? '';
    } else if (arg === '--rule' || arg === '-r') {
      const raw = argv[++i] ?? '';
      const [pattern, reason] = raw.split(':');
      if (pattern) args.rules.push({ pattern: pattern.trim(), reason: reason?.trim() });
    } else if (arg === '--json') {
      args.json = true;
    }
  }
  return args;
}

export function runDeprecateCommand(
  argv: string[],
  entries: DiffEntry[],
  out: (msg: string) => void = console.log
): void {
  const args = parseDeprecateArgs(argv);

  let rules: DeprecationRule[] = [...args.rules];

  if (args.profile) {
    const profile = getDeprecationProfile(args.profile);
    if (!profile) {
      out(`Error: deprecation profile "${args.profile}" not found.`);
      return;
    }
    rules = [...profile.rules, ...rules];
  }

  if (rules.length === 0) {
    out('No deprecation rules provided. Use --rule or --profile.');
    return;
  }

  const results = findDeprecations(entries, rules);

  if (args.json) {
    out(JSON.stringify(results, null, 2));
  } else {
    out(formatDeprecationReport(results));
  }
}
