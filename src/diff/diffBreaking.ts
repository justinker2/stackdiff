import { DiffEntry } from "./diffFilter";

export type BreakingLevel = "breaking" | "potentially-breaking" | "safe";

export interface BreakingEntry {
  entry: DiffEntry;
  level: BreakingLevel;
  reason: string;
}

export interface BreakingReport {
  breaking: BreakingEntry[];
  potentiallyBreaking: BreakingEntry[];
  safe: BreakingEntry[];
}

export function classifyBreaking(entry: DiffEntry): BreakingEntry {
  const { change, path } = entry;

  if (change === "removed") {
    return { entry, level: "breaking", reason: `Field '${path}' was removed` };
  }

  if (change === "type-changed") {
    return {
      entry,
      level: "breaking",
      reason: `Field '${path}' changed type from '${entry.from}' to '${entry.to}'`,
    };
  }

  if (change === "added") {
    return {
      entry,
      level: "safe",
      reason: `Field '${path}' was added (additive change)`,
    };
  }

  return {
    entry,
    level: "potentially-breaking",
    reason: `Field '${path}' changed in an unknown way`,
  };
}

export function analyzeBreaking(entries: DiffEntry[]): BreakingReport {
  const report: BreakingReport = { breaking: [], potentiallyBreaking: [], safe: [] };

  for (const entry of entries) {
    const classified = classifyBreaking(entry);
    if (classified.level === "breaking") report.breaking.push(classified);
    else if (classified.level === "potentially-breaking") report.potentiallyBreaking.push(classified);
    else report.safe.push(classified);
  }

  return report;
}

export function formatBreakingReport(report: BreakingReport): string {
  const lines: string[] = [];

  const section = (label: string, items: BreakingEntry[]) => {
    if (items.length === 0) return;
    lines.push(`\n${label} (${items.length})`);
    for (const item of items) {
      lines.push(`  [${item.level}] ${item.reason}`);
    }
  };

  lines.push("=== Breaking Change Analysis ===");
  section("BREAKING", report.breaking);
  section("POTENTIALLY BREAKING", report.potentiallyBreaking);
  section("SAFE", report.safe);

  const total = report.breaking.length + report.potentiallyBreaking.length + report.safe.length;
  lines.push(`\nTotal: ${total} change(s), ${report.breaking.length} breaking.`);

  return lines.join("\n");
}
