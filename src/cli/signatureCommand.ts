/**
 * signatureCommand.ts
 * CLI handler for the `stackdiff signature` sub-command.
 * Computes and optionally compares diff signatures.
 */

import { signDiff, signaturesMatch, formatSignature } from "../diff/diffSignature";
import { readCache } from "../diff/diffCache";

export interface SignatureArgs {
  key: string;
  compareKey?: string;
  json: boolean;
}

export function parseSignatureArgs(argv: string[]): SignatureArgs {
  const args: SignatureArgs = { key: "", json: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--compare" || arg === "-c") {
      args.compareKey = argv[++i];
    } else if (arg === "--json") {
      args.json = true;
    } else if (!args.key) {
      args.key = arg;
    }
  }

  if (!args.key) {
    throw new Error("Usage: stackdiff signature <cache-key> [--compare <other-key>] [--json]");
  }

  return args;
}

export async function runSignatureCommand(
  args: SignatureArgs,
  out: (msg: string) => void = console.log
): Promise<void> {
  const primary = await readCache(args.key);
  if (!primary) {
    throw new Error(`No cached diff found for key: ${args.key}`);
  }

  const sig = signDiff(primary.entries);

  if (args.compareKey) {
    const secondary = await readCache(args.compareKey);
    if (!secondary) {
      throw new Error(`No cached diff found for key: ${args.compareKey}`);
    }
    const sig2 = signDiff(secondary.entries);
    const match = signaturesMatch(sig, sig2);

    if (args.json) {
      out(JSON.stringify({ primary: sig, secondary: sig2, match }, null, 2));
    } else {
      out("=== Primary ===");
      out(formatSignature(sig));
      out("");
      out("=== Secondary ===");
      out(formatSignature(sig2));
      out("");
      out(match ? "✔ Signatures MATCH" : "✘ Signatures DIFFER");
    }
    return;
  }

  if (args.json) {
    out(JSON.stringify(sig, null, 2));
  } else {
    out(formatSignature(sig));
  }
}
