/**
 * diffSchema – validate diff entries against a lightweight JSON-schema
 * (type + required-fields only; no external dependencies).
 */

export interface SchemaRule {
  path: string;        // glob / exact path to match
  type?: string;       // expected JS typeof value
  required?: boolean;  // must be present (not "removed")
}

export interface SchemaViolation {
  path: string;
  rule: string;
  expected: string;
  actual: string;
}

export interface DiffEntry {
  path: string;
  change: "added" | "removed" | "changed" | "unchanged";
  fromType?: string;
  toType?: string;
}

import { globToRegex } from "./diffFilter";

export function validateSchema(
  entries: DiffEntry[],
  rules: SchemaRule[]
): SchemaViolation[] {
  const violations: SchemaViolation[] = [];

  for (const rule of rules) {
    const re = globToRegex(rule.path);
    const matching = entries.filter((e) => re.test(e.path));

    if (rule.required) {
      const removed = matching.filter((e) => e.change === "removed");
      for (const e of removed) {
        violations.push({
          path: e.path,
          rule: "required",
          expected: "present",
          actual: "removed",
        });
      }
    }

    if (rule.type) {
      const mismatched = matching.filter(
        (e) =>
          e.change !== "removed" &&
          e.toType !== undefined &&
          e.toType !== rule.type
      );
      for (const e of mismatched) {
        violations.push({
          path: e.path,
          rule: "type",
          expected: rule.type,
          actual: e.toType ?? "unknown",
        });
      }
    }
  }

  return violations;
}

export function formatSchemaReport(violations: SchemaViolation[]): string {
  if (violations.length === 0) return "Schema validation passed – no violations.";
  const lines = [`Schema violations (${violations.length}):`];
  for (const v of violations) {
    lines.push(`  [${v.rule}] ${v.path}: expected ${v.expected}, got ${v.actual}`);
  }
  return lines.join("\n");
}
