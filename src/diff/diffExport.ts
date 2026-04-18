import * as fs from "fs";
import * as path from "path";
import { DiffEntry } from "./diffCache";

export type ExportFormat = "json" | "csv" | "markdown";

export function exportDiff(
  entries: DiffEntry[],
  format: ExportFormat,
  outputPath: string
): void {
  const content = serializeDiff(entries, format);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, "utf-8");
}

export function serializeDiff(entries: DiffEntry[], format: ExportFormat): string {
  switch (format) {
    case "json":
      return JSON.stringify(entries, null, 2);
    case "csv":
      return toCSV(entries);
    case "markdown":
      return toMarkdown(entries);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

function toCSV(entries: DiffEntry[]): string {
  const header = "key,type,leftValue,rightValue,timestamp";
  const rows = entries.map((e) => {
    const changes = e.diff ?? [];
    if (changes.length === 0) return `"(none)",none,,,${e.timestamp}`;
    return changes
      .map(
        (c) =>
          `"${c.key}",${c.type},"${c.leftValue ?? ""}","${c.rightValue ?? ""}",${e.timestamp}`
      )
      .join("\n");
  });
  return [header, ...rows].join("\n");
}

function toMarkdown(entries: DiffEntry[]): string {
  const lines: string[] = ["# Diff Export", ""];
  for (const entry of entries) {
    lines.push(`## ${new Date(entry.timestamp).toISOString()}`);
    lines.push(`**URL A:** ${entry.urlA}  `);
    lines.push(`**URL B:** ${entry.urlB}`);
    lines.push("");
    const changes = entry.diff ?? [];
    if (changes.length === 0) {
      lines.push("_No differences found._");
    } else {
      lines.push("| Key | Type | Left | Right |");
      lines.push("|-----|------|------|-------|");
      for (const c of changes) {
        lines.push(`| ${c.key} | ${c.type} | ${c.leftValue ?? ""} | ${c.rightValue ?? ""} |`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}
