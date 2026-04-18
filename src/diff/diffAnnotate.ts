import { DiffEntry } from "./diffCache";

export type Severity = "info" | "warning" | "error";

export interface Annotation {
  path: string;
  change: string;
  severity: Severity;
  message: string;
}

export function severityForChange(change: string): Severity {
  if (change === "removed") return "error";
  if (change === "type_changed") return "warning";
  return "info";
}

export function annotateEntry(entry: DiffEntry): Annotation[] {
  return entry.diffs.map((d) => ({
    path: d.path,
    change: d.change,
    severity: severityForChange(d.change),
    message: buildMessage(d.path, d.change, d.leftType, d.rightType),
  }));
}

function buildMessage(
  path: string,
  change: string,
  leftType?: string,
  rightType?: string
): string {
  if (change === "added") return `'${path}' was added (${rightType})`;
  if (change === "removed") return `'${path}' was removed (was ${leftType})`;
  if (change === "type_changed")
    return `'${path}' changed type from ${leftType} to ${rightType}`;
  return `'${path}' changed`;
}

export function annotateDiff(entries: DiffEntry[]): Annotation[] {
  return entries.flatMap(annotateEntry);
}

export function countBySeverity(
  annotations: Annotation[]
): Record<Severity, number> {
  const counts: Record<Severity, number> = { info: 0, warning: 0, error: 0 };
  for (const a of annotations) counts[a.severity]++;
  return counts;
}
