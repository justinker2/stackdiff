import { URL } from "url";

export interface CliArgs {
  urlA: string;
  urlB: string;
  headers: Record<string, string>;
  output: "text" | "json";
  timeout: number;
}

function parseHeaders(raw: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const h of raw) {
    const idx = h.indexOf(":");
    if (idx === -1) {
      throw new Error(`Invalid header format: "${h}". Expected "Key: Value".`);
    }
    const key = h.slice(0, idx).trim();
    const value = h.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

function assertValidUrl(raw: string): void {
  try {
    new URL(raw);
  } catch {
    throw new Error(`Invalid URL: "${raw}"`);
  }
}

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const positional: string[] = [];
  const rawHeaders: string[] = [];
  let output: "text" | "json" = "text";
  let timeout = 10000;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--header" || arg === "-H") {
      const val = args[++i];
      if (!val) throw new Error("--header requires a value");
      rawHeaders.push(val);
    } else if (arg === "--output" || arg === "-o") {
      const val = args[++i];
      if (val !== "text" && val !== "json") {
        throw new Error(`--output must be "text" or "json", got "${val}"`);
      }
      output = val;
    } else if (arg === "--timeout" || arg === "-t") {
      const val = parseInt(args[++i], 10);
      if (isNaN(val) || val <= 0) throw new Error("--timeout must be a positive integer (ms)");
      timeout = val;
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    } else {
      throw new Error(`Unknown flag: "${arg}"`);
    }
  }

  if (positional.length < 2) {
    throw new Error("Usage: stackdiff <urlA> <urlB> [options]");
  }

  assertValidUrl(positional[0]);
  assertValidUrl(positional[1]);

  return {
    urlA: positional[0],
    urlB: positional[1],
    headers: parseHeaders(rawHeaders),
    output,
    timeout,
  };
}
