import { summarizeDiff, formatSummaryReport } from "./diffSummarize";
import type { DiffEntry } from "./shapeDiff";

function makeEntry(path: string, change: DiffEntry["change"]): DiffEntry {
  return { path, change, left: "string", right: "string" };
}

describe("summarizeDiff", () => {
  it("counts each change type correctly", () => {
    const entries: DiffEntry[] = [
      makeEntry("a.b", "added"),
      makeEntry("a.c", "removed"),
      makeEntry("a.d", "changed"),
      makeEntry("a.e", "unchanged"),
      makeEntry("a.f", "unchanged"),
    ];
    const s = summarizeDiff(entries);
    expect(s.total).toBe(5);
    expect(s.added).toBe(1);
    expect(s.removed).toBe(1);
    expect(s.changed).toBe(1);
    expect(s.unchanged).toBe(2);
  });

  it("computes changeRate as fraction of non-unchanged", () => {
    const entries: DiffEntry[] = [
      makeEntry("x", "added"),
      makeEntry("y", "unchanged"),
      makeEntry("z", "unchanged"),
      makeEntry("w", "unchanged"),
    ];
    const s = summarizeDiff(entries);
    expect(s.changeRate).toBeCloseTo(0.25);
  });

  it("returns zero changeRate for empty input", () => {
    const s = summarizeDiff([]);
    expect(s.total).toBe(0);
    expect(s.changeRate).toBe(0);
  });

  it("limits topPaths to 5 entries", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry(`path.${i}`, "added")
    );
    const s = summarizeDiff(entries);
    expect(s.topPaths.length).toBe(5);
  });

  it("excludes unchanged paths from topPaths", () => {
    const entries: DiffEntry[] = [
      makeEntry("keep.me", "changed"),
      makeEntry("skip.me", "unchanged"),
    ];
    const s = summarizeDiff(entries);
    expect(s.topPaths).toEqual(["keep.me"]);
  });
});

describe("formatSummaryReport", () => {
  it("includes all counts and change rate", () => {
    const entries: DiffEntry[] = [
      makeEntry("foo.bar", "added"),
      makeEntry("foo.baz", "removed"),
    ];
    const report = formatSummaryReport(summarizeDiff(entries));
    expect(report).toContain("Total paths : 2");
    expect(report).toContain("Added     : 1");
    expect(report).toContain("Removed   : 1");
    expect(report).toContain("Change rate : 100.0%");
  });

  it("lists top changed paths", () => {
    const entries: DiffEntry[] = [makeEntry("alpha.x", "changed")];
    const report = formatSummaryReport(summarizeDiff(entries));
    expect(report).toContain("- alpha.x");
  });

  it("omits top paths section when all unchanged", () => {
    const entries: DiffEntry[] = [makeEntry("q", "unchanged")];
    const report = formatSummaryReport(summarizeDiff(entries));
    expect(report).not.toContain("Top changed paths");
  });
});
