import * as path from "path";
import { loadHistory } from "../diff/diffHistory";
import { exportDiff, ExportFormat } from "../diff/diffExport";

export interface ExportOptions {
  format: ExportFormat;
  output: string;
  limit?: number;
}

export function parseExportArgs(argv: string[]): ExportOptions {
  let format: ExportFormat = "json";
  let output = "./stackdiff-export";
  let limit: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--format" && argv[i + 1]) {
      const f = argv[++i];
      if (f !== "json" && f !== "csv" && f !== "markdown") {
        throw new Error(`Invalid format "${f}". Use json, csv, or markdown.`);
      }
      format = f;
    } else if (argv[i] === "--output" && argv[i + 1]) {
      output = argv[++i];
    } else if (argv[i] === "--limit" && argv[i + 1]) {
      limit = parseInt(argv[++i], 10);
      if (isNaN(limit) || limit < 1) throw new Error("--limit must be a positive integer");
    }
  }

  return { format, output, limit };
}

export function runExportCommand(argv: string[]): void {
  const opts = parseExportArgs(argv);
  let entries = loadHistory();

  if (opts.limit !== undefined) {
    entries = entries.slice(-opts.limit);
  }

  if (entries.length === 0) {
    console.log("No diff history found to export.");
    return;
  }

  const ext = opts.format === "markdown" ? "md" : opts.format;
  const outputPath = opts.output.endsWith(`.${ext}`)
    ? opts.output
    : `${opts.output}.${ext}`;

  exportDiff(entries, opts.format, outputPath);
  console.log(`Exported ${entries.length} entr${entries.length === 1 ? "y" : "ies"} to ${path.resolve(outputPath)}`);
}
