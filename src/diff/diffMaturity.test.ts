import {
  classifyMaturity,
  assessMaturity,
  formatMaturityReport,
} from "./diffMaturity";
import { DiffEntry } from "./shapeDiff";

const makeEntry = (path: string, change: "added" | "removed" | "changed" = "changed"): DiffEntry => ({
  path,
  change,
  left: "string",
  right: "number",
});

describe("classifyMaturity", () => {
  it("labels path with zero changes as new", () => {
    const result = classifyMaturity("data.id", 0);
    expect(result.level).toBe("new");
  });

  it("labels path with 1-2 changes as stable", () => {
    expect(classifyMaturity("data.name", 1).level).toBe("stable");
    expect(classifyMaturity("data.name", 2).level).toBe("stable");
  });

  it("labels path with 3-5 changes as evolving", () => {
    expect(classifyMaturity("data.status", 3).level).toBe("evolving");
    expect(classifyMaturity("data.status", 5).level).toBe("evolving");
  });

  it("labels path with 6+ changes as volatile", () => {
    expect(classifyMaturity("data.flags", 6).level).toBe("volatile");
    expect(classifyMaturity("data.flags", 20).level).toBe("volatile");
  });

  it("includes reason string", () => {
    const result = classifyMaturity("x.y", 4);
    expect(result.reason).toMatch(/4/);
  });
});

describe("assessMaturity", () => {
  it("counts path occurrences across snapshots", () => {
    const snapshots = [
      [makeEntry("a.b"), makeEntry("a.c")],
      [makeEntry("a.b")],
      [makeEntry("a.b")],
    ];
    const report = assessMaturity(snapshots);
    const ab = report.entries.find((e) => e.path === "a.b");
    expect(ab?.changeCount).toBe(3);
    expect(ab?.level).toBe("evolving");
  });

  it("populates summary counts", () => {
    const snapshots = [
      [makeEntry("x"), makeEntry("y"), makeEntry("z")],
      [makeEntry("x"), makeEntry("y"), makeEntry("x")],
      [makeEntry("x"), makeEntry("x"), makeEntry("x"), makeEntry("x"), makeEntry("x")],
    ];
    const report = assessMaturity(snapshots);
    expect(report.summary.volatile).toBeGreaterThanOrEqual(1);
  });

  it("returns empty report for no snapshots", () => {
    const report = assessMaturity([]);
    expect(report.entries).toHaveLength(0);
    expect(report.summary.stable).toBe(0);
  });

  it("sorts entries by changeCount descending", () => {
    const snapshots = [[makeEntry("a")], [makeEntry("b"), makeEntry("b")]];
    const report = assessMaturity(snapshots);
    expect(report.entries[0].path).toBe("b");
  });
});

describe("formatMaturityReport", () => {
  it("includes header", () => {
    const report = assessMaturity([[makeEntry("p.q")]]);
    const out = formatMaturityReport(report);
    expect(out).toContain("Maturity Report");
  });

  it("includes path and level", () => {
    const report = assessMaturity([[makeEntry("p.q")]]);
    const out = formatMaturityReport(report);
    expect(out).toContain("p.q");
    expect(out).toContain("STABLE");
  });

  it("includes summary section", () => {
    const report = assessMaturity([[makeEntry("p.q")]]);
    const out = formatMaturityReport(report);
    expect(out).toContain("Summary");
  });
});
