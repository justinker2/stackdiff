import { analyzeBreaking, formatBreakingReport } from "../diff/diffBreaking";
import { filterDiff } from "../diff/diffFilter";
import { compareResponses } from "../diff";
import { parseArgs } from "./parseArgs";

export interface BreakingArgs {
  urlA: string;
  urlB: string;
  headersA: Record<string, string>;
  headersB: Record<string, string>;
  failOnBreaking: boolean;
  jsonOutput: boolean;
}

export function parseBreakingArgs(argv: string[]): BreakingArgs {
  const base = parseArgs(argv);
  const failOnBreaking = argv.includes("--fail-on-breaking");
  const jsonOutput = argv.includes("--json");
  return {
    urlA: base.urlA,
    urlB: base.urlB,
    headersA: base.headersA,
    headersB: base.headersB,
    failOnBreaking,
    jsonOutput,
  };
}

export async function runBreakingCommand(argv: string[]): Promise<void> {
  const args = parseBreakingArgs(argv);

  const entries = await compareResponses(
    args.urlA,
    args.urlB,
    args.headersA,
    args.headersB
  );

  const changed = filterDiff(entries, { changes: ["added", "removed", "type-changed"] });
  const report = analyzeBreaking(changed);

  if (args.jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatBreakingReport(report));
  }

  if (args.failOnBreaking && report.breaking.length > 0) {
    process.exit(1);
  }
}
