/**
 * diffSignature.ts
 * Computes a stable fingerprint/signature for a diff result set,
 * enabling quick equality checks between runs without full comparison.
 */

import { createHash } from "crypto";
import type { DiffEntry } from "./shapeDiff";

export interface SignatureResult {
  hash: string;
  pathCount: number;
  changeTypes: Record<string, number>;
  timestamp: string;
}

/**
 * Produce a deterministic sort key for a DiffEntry so the hash is
 * independent of insertion order.
 */
function entryKey(entry: DiffEntry): string {
  return `${entry.path}:${entry.change}:${entry.from ?? ""}:${entry.to ?? ""}`;
}

/**
 * Build a SHA-256 signature over the canonical representation of entries.
 */
export function signDiff(entries: DiffEntry[]): SignatureResult {
  const sorted = [...entries].sort((a, b) =>
    entryKey(a).localeCompare(entryKey(b))
  );

  const changeTypes: Record<string, number> = {};
  const canonical = sorted
    .map((e) => {
      changeTypes[e.change] = (changeTypes[e.change] ?? 0) + 1;
      return entryKey(e);
    })
    .join("\n");

  const hash = createHash("sha256").update(canonical).digest("hex");

  return {
    hash,
    pathCount: entries.length,
    changeTypes,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Compare two signatures and return true when they represent identical diffs.
 */
export function signaturesMatch(
  a: SignatureResult,
  b: SignatureResult
): boolean {
  return a.hash === b.hash;
}

/**
 * Format a signature result for human-readable output.
 */
export function formatSignature(sig: SignatureResult): string {
  const lines: string[] = [
    `Signature : ${sig.hash}`,
    `Paths     : ${sig.pathCount}`,
    `Timestamp : ${sig.timestamp}`,
    `Changes   :`,
  ];
  for (const [type, count] of Object.entries(sig.changeTypes)) {
    lines.push(`  ${type.padEnd(10)} ${count}`);
  }
  return lines.join("\n");
}
