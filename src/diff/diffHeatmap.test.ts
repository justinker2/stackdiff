import { buildHeatmap, formatHeatmapReport } from "./diffHeatmap";
import { DiffEntry } from "./shapeDiff";

function makeEntry(path: string, change: "added" | "removed" | "changed" = "changed"): DiffEntry {
  return { path, change };
}

describe("buildHeatmap", () => {
  it("returns empty report for no entries", () => {
    const report = buildHeatmap([]);
    expect(report.cells).toHaveLength(0);
    expect(report.maxChanges).toBe(0);
    expect(report.totalPaths).toBe(0);
  });

  it("groups entries by root segment", () => {
    const entries = [
      makeEntry("user.name"),
      makeEntry("user.age"),
      makeEntry("order.id"),
    ];
    const report = buildHeatmap(entries);
    expect(report.totalPaths).toBe(2);
    const user = report.cells.find((c) => c.path === "user");
    expect(user?.changeCount).toBe(2);
  });

  it("assigns intensity 1.0 to the most-changed root", () => {
    const entries = [
      makeEntry("user.a"),
      makeEntry("user.b"),
      makeEntry("user.c"),
      makeEntry("order.x"),
    ];
    const report = buildHeatmap(entries);
    const top = report.cells[0];
    expect(top.path).toBe("user");
    expect(top.intensity).toBeCloseTo(1.0);
    expect(top.label).toBe("high");
  });

  it("assigns correct labels for low intensity", () => {
    const entries = [
      makeEntry("alpha.x"),
      makeEntry("alpha.y"),
      makeEntry("alpha.z"),
      makeEntry("beta.a"),
    ];
    const report = buildHeatmap(entries);
    const beta = report.cells.find((c) => c.path === "beta");
    expect(beta?.label).toBe("low");
  });

  it("handles entries with no dot (root-level paths)", () => {
    const entries = [makeEntry("status"), makeEntry("status"), makeEntry("count")];
    const report = buildHeatmap(entries);
    expect(report.totalPaths).toBe(2);
    expect(report.cells[0].path).toBe("status");
    expect(report.cells[0].changeCount).toBe(2);
  });
});

describe("formatHeatmapReport", () => {
  it("returns fallback message for empty report", () => {
    const out = formatHeatmapReport({ cells: [], maxChanges: 0, totalPaths: 0 });
    expect(out).toContain("no changes");
  });

  it("includes path names and intensity bars", () => {
    const entries = [makeEntry("user.name"), makeEntry("user.age"), makeEntry("order.id")];
    const report = buildHeatmap(entries);
    const out = formatHeatmapReport(report);
    expect(out).toContain("user");
    expect(out).toContain("order");
    expect(out).toContain("high");
  });
});
