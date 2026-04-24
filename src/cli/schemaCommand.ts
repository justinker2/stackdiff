import * as fs from "fs";
import * as path from "path";
import { validateSchema, formatSchemaReport, SchemaRule, DiffEntry } from "../diff/diffSchema";

export interface SchemaCommandArgs {
  diffFile: string;
  schemaFile: string;
  outputFormat: "text" | "json";
}

export function parseSchemaArgs(argv: string[]): SchemaCommandArgs {
  const args = argv.slice(2);
  let diffFile = "";
  let schemaFile = "";
  let outputFormat: "text" | "json" = "text";

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--diff" || args[i] === "-d") && args[i + 1]) {
      diffFile = args[++i];
    } else if ((args[i] === "--schema" || args[i] === "-s") && args[i + 1]) {
      schemaFile = args[++i];
    } else if (args[i] === "--json") {
      outputFormat = "json";
    }
  }

  if (!diffFile || !schemaFile) {
    console.error("Usage: stackdiff schema --diff <file> --schema <file> [--json]");
    process.exit(1);
  }

  return { diffFile, schemaFile, outputFormat };
}

export function runSchemaCommand(args: SchemaCommandArgs): void {
  const diffRaw = fs.readFileSync(path.resolve(args.diffFile), "utf8");
  const schemaRaw = fs.readFileSync(path.resolve(args.schemaFile), "utf8");

  const entries: DiffEntry[] = JSON.parse(diffRaw);
  const rules: SchemaRule[] = JSON.parse(schemaRaw);

  const violations = validateSchema(entries, rules);

  if (args.outputFormat === "json") {
    console.log(JSON.stringify(violations, null, 2));
  } else {
    console.log(formatSchemaReport(violations));
  }

  if (violations.length > 0) process.exit(1);
}
