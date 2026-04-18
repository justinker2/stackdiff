import { annotateEntry, annotateDiff, countBySeverity, severityForChange } from "./diffAnnotate";
import { DiffEntry } from "./diffCache";

const makeEntry = (diffs: DiffEntry["diffs"]): DiffEntry => ({
  key: "test",
  timestamp: Date.now(),
  urlA: "http://a.com",
  urlB: "http://b.com",
  diffs,
});

describe("severityForChange", () => {
  it("returns error for removed", () => expect(severityForChange("removed")).toBe("error"));
  it("returns warning for type_changed", () => expect(severityForChange("type_changed")).toBe("warning"));
  it("returns info for added", () => expect(severityForChange("added")).toBe("info"));
});

describe("annotateEntry", () => {
  it("produces one annotation per diff", () => {
    const entry = makeEntry([
      { path: "user.id", change: "removed", leftType: "number" },
      { path: "user.name", change: "added", rightType: "string" },
    ]);
    const result = annotateEntry(entry);
    expect(result).toHaveLength(2);
    expect(result[0].severity).toBe("error");
    expect(result[1].severity).toBe("info");
  });

  it("includes path in message", () => {
    const entry = makeEntry([{ path: "foo.bar", change: "added", rightType: "boolean" }]);
    expect(annotateEntry(entry)[0].message).toContain("foo.bar");
  });
});

describe("annotateDiff", () => {
  it("flattens annotations from multiple entries", () => {
    const entries = [
      makeEntry([{ path: "a", change: "added", rightType: "string" }]),
      makeEntry([{ path: "b", change: "removed", leftType: "number" }]),
    ];
    expect(annotateDiff(entries)).toHaveLength(2);
  });
});

describe("countBySeverity", () => {
  it("counts correctly", () => {
    const annotations = annotateDiff([
      makeEntry([
        { path: "a", change: "removed", leftType: "string" },
        { path: "b", change: "type_changed", leftType: "string", rightType: "number" },
        { path: "c", change: "added", rightType: "boolean" },
      ]),
    ]);
    const counts = countBySeverity(annotations);
    expect(counts.error).toBe(1);
    expect(counts.warning).toBe(1);
    expect(counts.info).toBe(1);
  });
});
