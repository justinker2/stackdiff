import { groupBy, formatGroupReport } from "./diffGroup";
import { DiffEntry } from "./diffFilter";

const entries: DiffEntry[] = [
  { path: "user.id", change: "added", from: undefined, to: "number" },
  { path: "user.name", change: "changed", from: "string", to: "null" },
  { path: "meta.version", change: "removed", from: "string", to: undefined },
  { path: "meta.ts", change: "added", from: undefined, to: "string" },
];

describe("groupBy", () => {
  it("groups by top-level path segment", () => {
    const groups = groupBy(entries, "path");
    expect(groups.map((g) => g.key)).toEqual(["meta", "user"]);
    expect(groups.find((g) => g.key === "user")?.entries).toHaveLength(2);
    expect(groups.find((g) => g.key === "meta")?.entries).toHaveLength(2);
  });

  it("groups by changeType", () => {
    const groups = groupBy(entries, "changeType");
    const keys = groups.map((g) => g.key).sort();
    expect(keys).toEqual(["added", "changed", "removed"]);
    expect(groups.find((g) => g.key === "added")?.entries).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(groupBy([], "path")).toEqual([]);
  });

  it("groups by severity falling back to unknown", () => {
    const groups = groupBy(entries, "severity");
    expect(groups.every((g) => g.key === "unknown")).toBe(true);
  });
});

describe("formatGroupReport", () => {
  it("formats grouped output", () => {
    const groups = groupBy(entries, "changeType");
    const report = formatGroupReport(groups);
    expect(report).toContain("[added]");
    expect(report).toContain("[changed]");
    expect(report).toContain("user.name: string → null");
    expect(report).toContain("meta.version (removed)");
  });

  it("shows singular change label for single entry", () => {
    const groups = groupBy([entries[1]], "changeType");
    const report = formatGroupReport(groups);
    expect(report).toContain("1 change)");
  });
});
