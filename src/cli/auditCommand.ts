import { DiffEntry } from "../diff/shapeDiff";
import { auditDiff, formatAuditReport, AuditRule, AuditSeverity } from "../diff/diffAudit";

export interface AuditArgs {
  entries: DiffEntry[];
  minSeverity: AuditSeverity;
  failOn: AuditSeverity | null;
  json: boolean;
}

export function parseAuditArgs(argv: string[]): AuditArgs {
  const args: AuditArgs = {
    entries: [],
    minSeverity: "info",
    failOn: "error",
    json: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--min-severity" && argv[i + 1]) {
      const val = argv[++i] as AuditSeverity;
      if (["info", "warn", "error"].includes(val)) args.minSeverity = val;
    } else if (arg === "--fail-on" && argv[i + 1]) {
      const val = argv[++i];
      if (val === "none") args.failOn = null;
      else if (["info", "warn", "error"].includes(val)) args.failOn = val as AuditSeverity;
    } else if (arg === "--json") {
      args.json = true;
    }
  }

  return args;
}

const SEVERITY_RANK: Record<AuditSeverity, number> = { info: 0, warn: 1, error: 2 };

export function runAuditCommand(
  entries: DiffEntry[],
  argv: string[],
  rules?: AuditRule[]
): { output: string; exitCode: number } {
  const args = parseAuditArgs(argv);
  const result = auditDiff(entries, rules);

  const filtered = {
    ...result,
    violations: result.violations.filter(
      (v) => SEVERITY_RANK[v.severity] >= SEVERITY_RANK[args.minSeverity]
    ),
  };

  let output: string;
  if (args.json) {
    output = JSON.stringify(filtered, null, 2);
  } else {
    output = formatAuditReport(filtered);
  }

  let exitCode = 0;
  if (args.failOn !== null) {
    const hasFailure = filtered.violations.some(
      (v) => SEVERITY_RANK[v.severity] >= SEVERITY_RANK[args.failOn!]
    );
    if (hasFailure) exitCode = 1;
  }

  return { output, exitCode };
}
