import { Annotation, Severity, countBySeverity } from "../diff/diffAnnotate";
import chalk from "chalk";

const ICONS: Record<Severity, string> = {
  info: chalk.blue("ℹ"),
  warning: chalk.yellow("⚠"),
  error: chalk.red("✖"),
};

export function formatAnnotation(a: Annotation): string {
  const icon = ICONS[a.severity];
  return `  ${icon}  ${a.message}`;
}

export function formatAnnotationReport(annotations: Annotation[]): string {
  if (annotations.length === 0) return chalk.green("No differences found.");

  const lines: string[] = [];
  const grouped = groupBySeverity(annotations);

  for (const severity of ["error", "warning", "info"] as Severity[]) {
    const group = grouped[severity];
    if (!group || group.length === 0) continue;
    lines.push(chalk.bold(`\n${severity.toUpperCase()}S`));
    group.forEach((a) => lines.push(formatAnnotation(a)));
  }

  const counts = countBySeverity(annotations);
  lines.push(
    `\nSummary: ${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info(s)`
  );

  return lines.join("\n");
}

function groupBySeverity(
  annotations: Annotation[]
): Record<Severity, Annotation[]> {
  const grouped: Record<Severity, Annotation[]> = { info: [], warning: [], error: [] };
  for (const a of annotations) grouped[a.severity].push(a);
  return grouped;
}
