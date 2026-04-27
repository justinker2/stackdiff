import { signDiff, signaturesMatch, formatSignature } from "./diffSignature";
import type { DiffEntry } from "./shapeDiff";

function makeEntry(
  path: string,
  change: string,
  from?: string,
  to?: string
): DiffEntry {
  return { path, change, from, to } as DiffEntry;
}

describe("signDiff", () => {
  it("returns a 64-char hex hash", () => {
    const result = signDiff([makeEntry("a.b", "added", undefined, "string")]);
    expect(result.hash).toHaveLength(64);
    expect(result.hash).toMatch(/^[0-9a-f]+$/);
  });

  it("counts paths and change types", () => {
    const entries = [
      makeEntry("a", "added"),
      makeEntry("b", "removed"),
      makeEntry("c", "added"),
    ];
    const sig = signDiff(entries);
    expect(sig.pathCount).toBe(3);
    expect(sig.changeTypes["added"]).toBe(2);
    expect(sig.changeTypes["removed"]).toBe(1);
  });

  it("produces the same hash regardless of entry order", () => {
    const e1 = makeEntry("x", "added", undefined, "number");
    const e2 = makeEntry("y", "removed", "string");
    const sig1 = signDiff([e1, e2]);
    const sig2 = signDiff([e2, e1]);
    expect(sig1.hash).toBe(sig2.hash);
  });

  it("produces different hashes for different entries", () => {
    const sig1 = signDiff([makeEntry("a", "added")]);
    const sig2 = signDiff([makeEntry("b", "added")]);
    expect(sig1.hash).not.toBe(sig2.hash);
  });

  it("returns empty changeTypes for empty input", () => {
    const sig = signDiff([]);
    expect(sig.pathCount).toBe(0);
    expect(sig.changeTypes).toEqual({});
  });
});

describe("signaturesMatch", () => {
  it("returns true for identical signatures", () => {
    const entries = [makeEntry("a", "added")];
    const s1 = signDiff(entries);
    const s2 = signDiff(entries);
    expect(signaturesMatch(s1, s2)).toBe(true);
  });

  it("returns false for different signatures", () => {
    const s1 = signDiff([makeEntry("a", "added")]);
    const s2 = signDiff([makeEntry("b", "added")]);
    expect(signaturesMatch(s1, s2)).toBe(false);
  });
});

describe("formatSignature", () => {
  it("includes hash, pathCount, and change types", () => {
    const sig = signDiff([makeEntry("a", "added"), makeEntry("b", "removed")]);
    const output = formatSignature(sig);
    expect(output).toContain("Signature");
    expect(output).toContain(sig.hash);
    expect(output).toContain("Paths     : 2");
    expect(output).toContain("added");
    expect(output).toContain("removed");
  });
});
