import { analyzeBreaking, classifyBreaking, formatBreakingReport } from "./diffBreaking";
import { DiffEntry } from "./diffFilter";

const makeEntry = (path: string, change: string, from?: string, to?: string): DiffEntry =>
  ({ path, change, from, to } as DiffEntry);

describe("classifyBreaking", () => {
  it("classifies removed fields as breaking", () => {
    const result = classifyBreaking(makeEntry("user.email", "removed"));
    expect(result.level).toBe("breaking");
    expect(result.reason).toContain("removed");
  });

  it("classifies type-changed fields as breaking", () => {
    const result = classifyBreaking(makeEntry("user.age", "type-changed", "string", "number"));
    expect(result.level).toBe("breaking");
    expect(result.reason).toContain("string");
    expect(result.reason).toContain("number");
  });

  it("classifies added fields as safe", () => {
    const result = classifyBreaking(makeEntry("user.nickname", "added"));
    expect(result.level).toBe("safe");
  });

  it("classifies unknown changes as potentially-breaking", () => {
    const result = classifyBreaking(makeEntry("meta.flags", "unknown"));
    expect(result.level).toBe("potentially-breaking");
  });
});

describe("analyzeBreaking", () => {
  it("groups entries into correct buckets", () => {
    const entries = [
      makeEntry("a", "removed"),
      makeEntry("b", "added"),
      makeEntry("c", "type-changed", "string", "number"),
      makeEntry("d", "unknown"),
    ];
    const report = analyzeBreaking(entries);
    expect(report.breaking).toHaveLength(2);
    expect(report.potentiallyBreaking).toHaveLength(1);
    expect(report.safe).toHaveLength(1);
  });

  it("returns empty report for no entries", () => {
    const report = analyzeBreaking([]);
    expect(report.breaking).toHaveLength(0);
    expect(report.potentiallyBreaking).toHaveLength(0);
    expect(report.safe).toHaveLength(0);
  });
});

describe("formatBreakingReport", () => {
  it("includes summary totals", () => {
    const report = analyzeBreaking([makeEntry("x", "removed"), makeEntry("y", "added")]);
    const text = formatBreakingReport(report);
    expect(text).toContain("Breaking Change Analysis");
    expect(text).toContain("2 change(s)");
    expect(text).toContain("1 breaking");
  });

  it("omits empty sections", () => {
    const report = analyzeBreaking([makeEntry("z", "added")]);
    const text = formatBreakingReport(report);
    expect(text).not.toContain("BREAKING (");
    expect(text).toContain("SAFE");
  });
});
