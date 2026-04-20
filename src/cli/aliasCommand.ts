/**
 * aliasCommand.ts — CLI sub-command for managing and applying alias rules
 */

import { aliasDiff, formatAliasReport, AliasRule } from '../diff/diffAlias';
import {
  saveAliasProfile,
  getAliasProfile,
  deleteAliasProfile,
  listAliasProfiles,
} from '../config/aliasProfile';

export interface AliasArgs {
  subcommand: 'apply' | 'save' | 'delete' | 'list';
  profile?: string;
  rules?: AliasRule[];
  entries?: Array<{ path: string; change: string }>;
}

export function parseAliasArgs(argv: string[]): AliasArgs {
  const [subcommand, ...rest] = argv;
  if (!['apply', 'save', 'delete', 'list'].includes(subcommand)) {
    throw new Error(`Unknown alias subcommand: ${subcommand}`);
  }
  const profileFlag = rest.indexOf('--profile');
  const profile = profileFlag !== -1 ? rest[profileFlag + 1] : undefined;
  return { subcommand: subcommand as AliasArgs['subcommand'], profile };
}

export async function runAliasCommand(
  args: AliasArgs,
  entries: Array<{ path: string; change: string }> = []
): Promise<string> {
  switch (args.subcommand) {
    case 'list': {
      const names = listAliasProfiles();
      return names.length ? names.join('\n') : 'No alias profiles saved.';
    }
    case 'delete': {
      if (!args.profile) throw new Error('--profile required for delete');
      const removed = deleteAliasProfile(args.profile);
      return removed ? `Deleted profile "${args.profile}".` : `Profile "${args.profile}" not found.`;
    }
    case 'save': {
      if (!args.profile) throw new Error('--profile required for save');
      const rules: AliasRule[] = args.rules ?? [];
      saveAliasProfile({ name: args.profile, rules });
      return `Saved alias profile "${args.profile}" with ${rules.length} rule(s).`;
    }
    case 'apply': {
      if (!args.profile) throw new Error('--profile required for apply');
      const profile = getAliasProfile(args.profile);
      if (!profile) throw new Error(`Alias profile "${args.profile}" not found.`);
      const aliased = aliasDiff(entries, profile.rules);
      return formatAliasReport(aliased);
    }
    default:
      throw new Error('Unhandled subcommand');
  }
}
