import { detectOutliers, formatOutlierReport } from "./diffOutlier";
import type { DiffEntry } from "./diffFilter";

function makeEntry(path: string, change: DiffEntry["change"] = "changed"): DiffEntry {
  return { path, change, left: "string", right: "number" };
}

describe("detectOutliers", () => {
  it("returns empty outliers when all depths are equal", () => {
    const entries = [makeEntry("a.b"), makeEntry("c.d"), makeEntry("e.f")];
    const report = detectOutliers(entries);
    expect(report.results.every((r) => !r.isOutlier)).toBe(true);
  });

  it("flags deeply nested paths as outliers", () => {
    const entries = [
      makeEntry("a.b"),
      makeEntry("c.d"),
      makeEntry("e.f"),
      makeEntry("x.y.z.w.v.u.t.s.r"),
    ];
    const report = detectOutliers(entries, 1.5);
    const outlier = report.results.find((r) => r.entry.path === "x.y.z.w.v.u.t.s.r");
    expect(outlier?.isOutlier).toBe(true);
  });

  it("computes correct mean and stddev", () => {
    const entries = [makeEntry("a"), makeEntry("a.b"), makeEntry("a.b.c")];
    const report = detectOutliers(entries);
    expect(report.mean).toBeCloseTo(2, 5);
    expect(report.stddev).toBeGreaterThan(0);
  });

  it("handles single entry without throwing", () => {
    const entries = [makeEntry("a.b")];
    const report = detectOutliers(entries);
    expect(report.results).toHaveLength(1);
    expect(report.results[0].zscore).toBe(0);
  });

  it("handles empty entries", () => {
    const report = detectOutliers([]);
    expect(report.results).toHaveLength(0);
    expect(report.mean).toBe(0);
  });
});

describe("formatOutlierReport", () => {
  it("returns no-outlier message when clean", () => {
    const entries = [makeEntry("a.b"), makeEntry("c.d")];
    const report = detectOutliers(entries);
    expect(formatOutlierReport(report)).toBe("No outliers detected.");
  });

  it("includes outlier path and zscore in output", () => {
    const entries = [
      makeEntry("a.b"),
      makeEntry("c.d"),
      makeEntry("e.f"),
      makeEntry("x.y.z.w.v.u.t.s.r"),
    ];
    const report = detectOutliers(entries, 1.5);
    const output = formatOutlierReport(report);
    expect(output).toContain("x.y.z.w.v.u.t.s.r");
    expect(output).toContain("outlier(s) found");
  });
});
