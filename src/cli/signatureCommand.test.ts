import { parseSignatureArgs, runSignatureCommand } from "./signatureCommand";
import * as diffCache from "../diff/diffCache";
import type { DiffEntry } from "../diff/shapeDiff";

function makeEntry(path: string, change: string): DiffEntry {
  return { path, change } as DiffEntry;
}

const FAKE_CACHE: Record<string, { entries: DiffEntry[] }> = {
  "run-1": { entries: [makeEntry("a", "added"), makeEntry("b", "removed")] },
  "run-2": { entries: [makeEntry("a", "added"), makeEntry("b", "removed")] },
  "run-3": { entries: [makeEntry("x", "changed")] },
};

beforeEach(() => {
  jest
    .spyOn(diffCache, "readCache")
    .mockImplementation(async (key: string) => FAKE_CACHE[key] ?? null);
});

afterEach(() => jest.restoreAllMocks());

describe("parseSignatureArgs", () => {
  it("parses a simple key", () => {
    const args = parseSignatureArgs(["run-1"]);
    expect(args.key).toBe("run-1");
    expect(args.compareKey).toBeUndefined();
    expect(args.json).toBe(false);
  });

  it("parses --compare and --json flags", () => {
    const args = parseSignatureArgs(["run-1", "--compare", "run-2", "--json"]);
    expect(args.key).toBe("run-1");
    expect(args.compareKey).toBe("run-2");
    expect(args.json).toBe(true);
  });

  it("throws when no key is provided", () => {
    expect(() => parseSignatureArgs([])).toThrow();
  });
});

describe("runSignatureCommand", () => {
  it("outputs formatted signature for a single key", async () => {
    const lines: string[] = [];
    await runSignatureCommand({ key: "run-1", json: false }, (m) =>
      lines.push(m)
    );
    expect(lines.some((l) => l.includes("Signature"))).toBe(true);
    expect(lines.some((l) => l.includes("Paths     : 2"))).toBe(true);
  });

  it("outputs JSON when --json flag is set", async () => {
    const lines: string[] = [];
    await runSignatureCommand({ key: "run-1", json: true }, (m) =>
      lines.push(m)
    );
    const parsed = JSON.parse(lines.join(""));
    expect(parsed).toHaveProperty("hash");
    expect(parsed.pathCount).toBe(2);
  });

  it("reports MATCH when two runs are identical", async () => {
    const lines: string[] = [];
    await runSignatureCommand(
      { key: "run-1", compareKey: "run-2", json: false },
      (m) => lines.push(m)
    );
    expect(lines.some((l) => l.includes("MATCH"))).toBe(true);
  });

  it("reports DIFFER when runs differ", async () => {
    const lines: string[] = [];
    await runSignatureCommand(
      { key: "run-1", compareKey: "run-3", json: false },
      (m) => lines.push(m)
    );
    expect(lines.some((l) => l.includes("DIFFER"))).toBe(true);
  });

  it("throws when cache key is missing", async () => {
    await expect(
      runSignatureCommand({ key: "missing", json: false })
    ).rejects.toThrow("No cached diff found");
  });
});
