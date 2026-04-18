import { tagDiff, groupByTag, formatTagReport, TagMap } from '../diff/diffTag';
import { DiffEntry } from '../diff/diffFilter';

export interface TagCommandArgs {
  entries: DiffEntry[];
  tagMap: TagMap;
  format: 'text' | 'json';
}

export function parseTagArgs(argv: string[]): Omit<TagCommandArgs, 'entries'> {
  const tagMap: TagMap = {};
  let format: 'text' | 'json' = 'text';

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--tag' && argv[i + 1]) {
      const [name, pattern] = argv[++i].split(':');
      if (!name || !pattern) {
        throw new Error(`Invalid --tag value: expected name:pattern`);
      }
      (tagMap[name] ||= []).push(pattern);
    } else if (argv[i] === '--format' && argv[i + 1]) {
      const val = argv[++i];
      if (val !== 'text' && val !== 'json') {
        throw new Error(`Invalid --format: ${val}`);
      }
      format = val;
    }
  }

  return { tagMap, format };
}

export function runTagCommand(args: TagCommandArgs): string {
  const tagged = tagDiff(
    args.entries.map((e) => ({ path: e.path, change: e.change })),
    args.tagMap
  );
  const groups = groupByTag(tagged);

  if (args.format === 'json') {
    return JSON.stringify(groups, null, 2);
  }

  return formatTagReport(groups);
}
