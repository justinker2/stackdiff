export type TagMap = Record<string, string[]>;

export interface TaggedEntry {
  path: string;
  tags: string[];
}

/**
 * Converts a glob-style pattern to a RegExp.
 * Supports `*` as a wildcard and escapes `.` characters.
 */
function globToRegExp(pattern: string): RegExp {
  return new RegExp(
    '^' + pattern.replace(/\./ g, '\\.').replace(/\*/g, '.*') + '$'
  );
}

export function assignTags(path: string, tagMap: TagMap): string[] {
  const tags: string[] = [];
  for (const [tag, patterns] of Object.entries(tagMap)) {
    for (const pattern of patterns) {
      if (globToRegExp(pattern).test(path)) {
        tags.push(tag);
        break;
      }
    }
  }
  return tags;
}

export function tagDiff(
  entries: { path: string; change: string }[],
  tagMap: TagMap
): TaggedEntry[] {
  return entries.map((e) => ({
    path: e.path,
    tags: assignTags(e.path, tagMap),
  }));
}

export function groupByTag(tagged: TaggedEntry[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const entry of tagged) {
    if (entry.tags.length === 0) {
      (result['untagged'] ||= []).push(entry.path);
    }
    for (const tag of entry.tags) {
      (result[tag] ||= []).push(entry.path);
    }
  }
  return result;
}

export function formatTagReport(groups: Record<string, string[]>): string {
  return Object.entries(groups)
    .map(([tag, paths]) => `[${tag}]\n` + paths.map((p) => `  ${p}`).join('\n'))
    .join('\n\n');
}
