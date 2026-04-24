import {
  pathSet,
  jaccardSimilarity,
  compareSimilarity,
  formatSimilarity,
} from "./diffSimilarity";
import type { DiffEntry } from "./shapeDiff";

const e = (path: string, type: DiffEntry["type"] = "changed"): DiffEntry => ({
  path,
  type,
  valueA: "string",
  valueB: "number",
});

describe("pathSet", () => {
  it("returns a set of paths", () => {
    const result = pathSet([e("a.b"), e("a.c")]);
    expect(result).toEqual(new Set(["a.b", "a.c"]));
  });

  it("deduplicates paths", () => {
    const result = pathSet([e("a.b"), e("a.b")]);
    expect(result.size).toBe(1);
  });
});

describe("jaccardSimilarity", () => {
  it("returns 1 for identical sets", () => {
    const s = new Set(["a", "b", "c"]);
    expect(jaccardSimilarity(s, s)).toBe(1);
  });

  it("returns 0 for disjoint sets", () => {
    expect(jaccardSimilarity(new Set(["a"]), new Set(["b"]))).toBe(0);
  });

  it("returns 1 for two empty sets", () => {
    expect(jaccardSimilarity(new Set(), new Set())).toBe(1);
  });

  it("computes partial overlap correctly", () => {
    const a = new Set(["a", "b", "c"]);
    const b = new Set(["b", "c", "d"]);
    // intersection = {b,c} = 2, union = {a,b,c,d} = 4
    expect(jaccardSimilarity(a, b)).toBeCloseTo(0.5);
  });
});

describe("compareSimilarity", () => {
  it("identifies matched, onlyInA, and onlyInB paths", () => {
    const a = [e("x.y"), e("x.z")];
    const b = [e("x.z"), e("x.w")];
    const result = compareSimilarity(a, b);
    expect(result.matchedPaths).toEqual(["x.z"]);
    expect(result.onlyInA).toEqual(["x.y"]);
    expect(result.onlyInB).toEqual(["x.w"]);
    expect(result.score).toBeCloseTo(1 / 3);
  });

  it("returns score 1 when both sets are identical", () => {
    const entries = [e("a"), e("b")];
    const result = compareSimilarity(entries, entries);
    expect(result.score).toBe(1);
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(0);
  });
});

describe("formatSimilarity", () => {
  it("includes the percentage score", () => {
    const result = compareSimilarity([e("a")], [e("a")]);
    const output = formatSimilarity(result);
    expect(output).toContain("100.0%");
  });

  it("lists paths only in A and B", () => {
    const result = compareSimilarity([e("only.a")], [e("only.b")]);
    const output = formatSimilarity(result);
    expect(output).toContain("only.a");
    expect(output).toContain("only.b");
  });
});
