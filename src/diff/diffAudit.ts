import { DiffEntry } from "./shapeDiff";

export type AuditSeverity = "info" | "warn" | "error";

export interface AuditRule {
  id: string;
  description: string;
  severity: AuditSeverity;
  check: (entry: DiffEntry) => boolean;
}

export interface AuditViolation {
  ruleId: string;
  description: string;
  severity: AuditSeverity;
  path: string;
  change: string;
}

export interface AuditResult {
  violations: AuditViolation[];
  passed: number;
  failed: number;
}

const DEFAULT_RULES: AuditRule[] = [
  {
    id: "no-type-widening",
    description: "Field type must not become more permissive (e.g. string -> any)",
    severity: "error",
    check: (e) =>
      e.change === "changed" &&
      (e.to === "any" || e.to === "unknown") &&
      e.from !== "any" && e.from !== "unknown",
  },
  {
    id: "no-required-removal",
    description: "Required fields must not be removed",
    severity: "error",
    check: (e) => e.change === "removed",
  },
  {
    id: "warn-type-change",
    description: "Field type changes should be reviewed",
    severity: "warn",
    check: (e) =>
      e.change === "changed" &&
      e.from !== undefined &&
      e.to !== undefined &&
      e.from !== e.to,
  },
  {
    id: "info-new-field",
    description: "New fields were added",
    severity: "info",
    check: (e) => e.change === "added",
  },
];

export function auditDiff(
  entries: DiffEntry[],
  rules: AuditRule[] = DEFAULT_RULES
): AuditResult {
  const violations: AuditViolation[] = [];
  let passed = 0;

  for (const entry of entries) {
    let entryPassed = true;
    for (const rule of rules) {
      if (rule.check(entry)) {
        violations.push({
          ruleId: rule.id,
          description: rule.description,
          severity: rule.severity,
          path: entry.path,
          change: entry.change,
        });
        entryPassed = false;
      }
    }
    if (entryPassed) passed++;
  }

  return { violations, passed, failed: violations.length };
}

export function formatAuditReport(result: AuditResult): string {
  if (result.violations.length === 0) {
    return `✅ Audit passed — ${result.passed} entries checked, no violations.`;
  }

  const lines: string[] = [
    `❌ Audit complete — ${result.passed} passed, ${result.failed} violation(s):`,
    "",
  ];

  const order: AuditSeverity[] = ["error", "warn", "info"];
  for (const sev of order) {
    const group = result.violations.filter((v) => v.severity === sev);
    if (group.length === 0) continue;
    const icon = sev === "error" ? "🔴" : sev === "warn" ? "🟡" : "🔵";
    lines.push(`${icon} ${sev.toUpperCase()} (${group.length})`);
    for (const v of group) {
      lines.push(`  [${v.ruleId}] ${v.path} (${v.change}) — ${v.description}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
