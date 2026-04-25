import { BreakingEntry, BreakingReport } from "../diff/diffBreaking";

const ICONS: Record<string, string> = {
  breaking: "✖",
  "potentially-breaking": "⚠",
  safe: "✔",
};

export function formatBreakingEntry(entry: BreakingEntry): string {
  const icon = ICONS[entry.level] ?? "?";
  return `${icon} [${entry.level}] ${entry.reason}`;
}

export function formatBreakingBadge(report: BreakingReport): string {
  const b = report.breaking.length;
  const p = report.potentiallyBreaking.length;
  const s = report.safe.length;
  if (b > 0) return `BREAKING (${b} issue${b !== 1 ? "s" : ""})`;
  if (p > 0) return `CAUTION (${p} potential issue${p !== 1 ? "s" : ""})`;
  return `OK (${s} safe change${s !== 1 ? "s" : ""})`;
}

export function formatBreakingMarkdown(report: BreakingReport): string {
  const lines: string[] = ["## Breaking Change Report", ""];

  const section = (heading: string, items: BreakingEntry[]) => {
    if (items.length === 0) return;
    lines.push(`### ${heading}`);
    for (const item of items) {
      lines.push(`- ${item.reason}`);
    }
    lines.push("");
  };

  section("Breaking", report.breaking);
  section("Potentially Breaking", report.potentiallyBreaking);
  section("Safe", report.safe);

  lines.push(`**Status:** ${formatBreakingBadge(report)}`);
  return lines.join("\n");
}

/**
 * Returns a plain-text summary of the breaking change report,
 * suitable for CLI output or log messages.
 */
export function formatBreakingPlainText(report: BreakingReport): string {
  const lines: string[] = [];

  for (const entry of report.breaking) {
    lines.push(formatBreakingEntry(entry));
  }
  for (const entry of report.potentiallyBreaking) {
    lines.push(formatBreakingEntry(entry));
  }
  for (const entry of report.safe) {
    lines.push(formatBreakingEntry(entry));
  }

  lines.push("");
  lines.push(`Status: ${formatBreakingBadge(report)}`);
  return lines.join("\n");
}
