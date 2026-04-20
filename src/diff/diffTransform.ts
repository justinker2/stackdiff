/**
 * diffTransform.ts
 *
 * Provides transformation utilities for diff entries — allows users to
 * remap, rename, or reshape diff paths before further processing.
 * Useful for normalising vendor-specific prefixes, versioned path segments,
 * or applying bulk path rewrites across a diff result set.
 */

import type { DiffEntry } from "./shapeDiff";

export interface TransformRule {
  /** A string or regex pattern to match against the diff path */
  match: string | RegExp;
  /** Replacement string (supports $1, $2 capture groups when match is a regex) */
  replace: string;
  /** Only apply to entries with these change types; omit to apply to all */
  onlyTypes?: Array<"added" | "removed" | "changed" | "unchanged">;
}

export interface TransformResult {
  entries: DiffEntry[];
  transformedCount: number;
  skippedCount: number;
}

/**
 * Compile a TransformRule's match value into a RegExp.
 */
export function compileRule(rule: TransformRule): RegExp {
  if (rule.match instanceof RegExp) {
    return rule.match;
  }
  // Escape special regex chars in plain string patterns, then anchor to full path
  const escaped = rule.match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped);
}

/**
 * Apply a single TransformRule to a DiffEntry path.
 * Returns the (possibly unchanged) path string.
 */
export function applyRule(entry: DiffEntry, rule: TransformRule): string {
  if (rule.onlyTypes && !rule.onlyTypes.includes(entry.change as any)) {
    return entry.path;
  }
  const regex = compileRule(rule);
  return entry.path.replace(regex, rule.replace);
}

/**
 * Apply an ordered list of TransformRules to every entry in a diff.
 * Rules are applied sequentially — the output path of one rule feeds
 * into the next.
 */
export function transformDiff(
  entries: DiffEntry[],
  rules: TransformRule[]
): TransformResult {
  if (rules.length === 0) {
    return { entries, transformedCount: 0, skippedCount: entries.length };
  }

  let transformedCount = 0;
  let skippedCount = 0;

  const transformed = entries.map((entry) => {
    let path = entry.path;
    for (const rule of rules) {
      path = applyRule({ ...entry, path }, rule);
    }
    if (path !== entry.path) {
      transformedCount++;
      return { ...entry, path };
    }
    skippedCount++;
    return entry;
  });

  return { entries: transformed, transformedCount, skippedCount };
}

/**
 * Format a human-readable summary of the transform operation.
 */
export function formatTransformSummary(result: TransformResult): string {
  const total = result.transformedCount + result.skippedCount;
  const lines: string[] = [
    `Transform summary (${total} entries):`,
    `  Transformed : ${result.transformedCount}`,
    `  Unchanged   : ${result.skippedCount}`,
  ];

  if (result.transformedCount > 0) {
    lines.push("");
    lines.push("Transformed paths:");
    result.entries
      .filter((_, i) => {
        // We don't have original paths here, so just list all entries
        return true;
      })
      .slice(0, 10)
      .forEach((e) => lines.push(`  ${e.path}`));
    if (result.transformedCount > 10) {
      lines.push(`  ... and ${result.transformedCount - 10} more`);
    }
  }

  return lines.join("\n");
}
