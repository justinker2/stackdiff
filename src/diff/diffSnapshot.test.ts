import * as fs from "fs";
import * as path from "path";
import {
  saveSnapshot,
  loadSnapshot,
  deleteSnapshot,
  listSnapshots,
  compareSnapshots,
  Snapshot,
} from "./diffSnapshot";

const SNAPSHOT_DIR = path.join(process.cwd(), ".stackdiff", "snapshots");

const mockEntries = [
  { path: "a.b", change: "added" as const, leftType: null, rightType: "string" },
  { path: "a.c", change: "removed" as const, leftType: "number", rightType: null },
];

afterEach(() => {
  ["test-snap", "snap-a", "snap-b"].forEach((name) => {
    const p = path.join(SNAPSHOT_DIR, `${name}.json`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
});

describe("saveSnapshot / loadSnapshot", () => {
  it("saves and loads a snapshot by name", () => {
    saveSnapshot("test-snap", "http://a.com", "http://b.com", mockEntries);
    const loaded = loadSnapshot("test-snap");
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("test-snap");
    expect(loaded!.url1).toBe("http://a.com");
    expect(loaded!.entries).toHaveLength(2);
  });

  it("returns null for missing snapshot", () => {
    expect(loadSnapshot("does-not-exist")).toBeNull();
  });
});

describe("deleteSnapshot", () => {
  it("deletes an existing snapshot and returns true", () => {
    saveSnapshot("test-snap", "http://a.com", "http://b.com", mockEntries);
    expect(deleteSnapshot("test-snap")).toBe(true);
    expect(loadSnapshot("test-snap")).toBeNull();
  });

  it("returns false when snapshot does not exist", () => {
    expect(deleteSnapshot("ghost")).toBe(false);
  });
});

describe("listSnapshots", () => {
  it("lists saved snapshots", () => {
    saveSnapshot("snap-a", "http://a.com", "http://b.com", []);
    saveSnapshot("snap-b", "http://a.com", "http://b.com", []);
    const list = listSnapshots();
    expect(list).toContain("snap-a");
    expect(list).toContain("snap-b");
  });
});

describe("compareSnapshots", () => {
  it("identifies paths only in A, only in B, and changed", () => {
    const a: Snapshot = { name: "a", createdAt: "", url1: "", url2: "", entries: [
      { path: "x", change: "added", leftType: null, rightType: "string" },
      { path: "y", change: "removed", leftType: "number", rightType: null },
    ]};
    const b: Snapshot = { name: "b", createdAt: "", url1: "", url2: "", entries: [
      { path: "y", change: "added", leftType: null, rightType: "string" },
      { path: "z", change: "removed", leftType: "number", rightType: null },
    ]};
    const result = compareSnapshots(a, b);
    expect(result.onlyInA).toContain("x");
    expect(result.onlyInB).toContain("z");
    expect(result.changed).toContain("y");
  });
});
