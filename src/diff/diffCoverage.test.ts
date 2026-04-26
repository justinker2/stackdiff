import { computeCoverage, formatCoverageReport } from "./diffCoverage";
import { DiffEntry } from "./shapeDiff";

function makeEntry(path: string, change: string): DiffEntry {
  return { path, change, from: "string", to: "number" } as DiffEntry;
}

const ALL_PATHS = ["a", "b", "c", "d", "e"];

describe("computeCoverage", () => {
  it("returns zero coverage for empty entries", () => {
    const result = computeCoverage([], ALL_PATHS);
    expect(result.coveragePercent).toBe(0);
    expect(result.changedPaths).toBe(0);
    expect(result.totalPaths).toBe(5);
    expect(result.uncoveredPaths).toEqual(ALL_PATHS);
  });

  it("computes partial coverage correctly", () => {
    const entries = [makeEntry("a", "changed"), makeEntry("c", "added")];
    const result = computeCoverage(entries, ALL_PATHS);
    expect(result.changedPaths).toBe(2);
    expect(result.coveragePercent).toBe(40);
    expect(result.uncoveredPaths).toEqual(["b", "d", "e"]);
  });

  it("computes full coverage", () => {
    const entries = ALL_PATHS.map((p) => makeEntry(p, "changed"));
    const result = computeCoverage(entries, ALL_PATHS);
    expect(result.coveragePercent).toBe(100);
    expect(result.uncoveredPaths).toHaveLength(0);
  });

  it("groups by change type", () => {
    const entries = [
      makeEntry("a", "added"),
      makeEntry("b", "added"),
      makeEntry("c", "removed"),
    ];
    const result = computeCoverage(entries, ALL_PATHS);
    expect(result.byChangeType["added"]).toBe(2);
    expect(result.byChangeType["removed"]).toBe(1);
  });

  it("handles empty allPaths", () => {
    const result = computeCoverage([], []);
    expect(result.coveragePercent).toBe(0);
    expect(result.totalPaths).toBe(0);
  });

  it("deduplicates entries with the same path", () => {
    const entries = [makeEntry("a", "changed"), makeEntry("a", "added")];
    const result = computeCoverage(entries, ALL_PATHS);
    expect(result.changedPaths).toBe(1);
  });
});

describe("formatCoverageReport", () => {
  it("includes coverage percentage", () => {
    const result = computeCoverage(
      [makeEntry("a", "changed")],
      ALL_PATHS
    );
    const report = formatCoverageReport(result);
    expect(report).toContain("20%");
    expect(report).toContain("1/5");
  });

  it("lists uncovered paths", () => {
    const result = computeCoverage([], ["x", "y"]);
    const report = formatCoverageReport(result);
    expect(report).toContain("x");
    expect(report).toContain("y");
  });

  it("truncates long uncovered path lists", () => {
    const paths = Array.from({ length: 15 }, (_, i) => `path${i}`);
    const result = computeCoverage([], paths);
    const report = formatCoverageReport(result);
    expect(report).toContain("and 5 more");
  });
});
