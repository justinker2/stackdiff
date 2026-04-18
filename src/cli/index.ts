import { parseArgs } from "./parseArgs";
import { compareResponses } from "../diff";

function printUsage(): void {
  console.log(`
Usage: stackdiff <urlA> <urlB> [options]

Arguments:
  urlA          First API endpoint URL
  urlB          Second API endpoint URL

Options:
  -H, --header  <Key: Value>   Add a request header (repeatable)
  -o, --output  <text|json>    Output format (default: text)
  -t, --timeout <ms>           Request timeout in ms (default: 10000)

Examples:
  stackdiff https://api.example.com/v1/users https://api.example.com/v2/users
  stackdiff <urlA> <urlB> -H "Authorization: Bearer token" -o json
`.trim());
}

export async function run(argv: string[]): Promise<void> {
  let args;
  try {
    args = parseArgs(argv);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}\n`);
    printUsage();
    process.exit(1);
  }

  try {
    const result = await compareResponses(
      args.urlA,
      args.urlB,
      { headers: args.headers, timeout: args.timeout }
    );

    if (args.output === "json") {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.changes.length === 0) {
        console.log("✓ No shape differences detected.");
      } else {
        console.log(`Found ${result.changes.length} difference(s):\n`);
        console.log(result.formatted);
      }
    }

    process.exit(result.changes.length > 0 ? 1 : 0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Request failed: ${message}`);
    process.exit(2);
  }
}
