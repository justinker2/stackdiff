import * as fs from "fs";
import * as path from "path";

export type OutputFormat = "text" | "json";

export interface ReportOptions {
  format: OutputFormat;
  outputPath?: string;
}

export interface DiffReport {
  urlA: string;
  urlB: string;
  timestamp: string;
  changes: Array<{
    key: string;
    change: string;
    typeA?: string;
    typeB?: string;
  }>;
  summary: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
  };
}

export function buildReport(
  urlA: string,
  urlB: string,
  diffLines: string[],
  rawChanges: Record<string, { before?: string; after?: string }>
): DiffReport {
  const changes = Object.entries(rawChanges).map(([key, val]) => ({
    key,
    change: !val.before ? "added" : !val.after ? "removed" : "changed",
    typeA: val.before,
    typeB: val.after,
  }));

  const summary = changes.reduce(
    (acc, c) => {
      acc[c.change as keyof typeof acc] =
        (acc[c.change as keyof typeof acc] || 0) + 1;
      return acc;
    },
    { added: 0, removed: 0, changed: 0, unchanged: 0 }
  );

  return { urlA, urlB, timestamp: new Date().toISOString(), changes, summary };
}

export function writeReport(report: DiffReport, options: ReportOptions): string {
  const content =
    options.format === "json"
      ? JSON.stringify(report, null, 2)
      : formatTextReport(report);

  if (options.outputPath) {
    const dir = path.dirname(options.outputPath);
    if (dir && dir !== ".") fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(options.outputPath, content, "utf-8");
  }

  return content;
}

function formatTextReport(report: DiffReport): string {
  const lines: string[] = [
    `stackdiff report — ${report.timestamp}`,
    `A: ${report.urlA}`,
    `B: ${report.urlB}`,
    "",
    `Summary: +${report.summary.added} added, -${report.summary.removed} removed, ~${report.summary.changed} changed`,
    "",
  ];

  for (const c of report.changes) {
    if (c.change === "added") lines.push(`  + ${c.key}: ${c.typeB}`);
    else if (c.change === "removed") lines.push(`  - ${c.key}: ${c.typeA}`);
    else lines.push(`  ~ ${c.key}: ${c.typeA} → ${c.typeB}`);
  }

  return lines.join("\n");
}
