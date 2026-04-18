import { serializeDiff, ExportFormat } from "./diffExport";
import { DiffEntry } from "./diffCache";

const makeEntry = (overrides?: Partial<DiffEntry>): DiffEntry => ({
  urlA: "http://a.example.com/api",
  urlB: "http://b.example.com/api",
  timestamp: 1700000000000,
  diff: [
    { key: "user.name", type: "changed", leftValue: "string", rightValue: "number" },
    { key: "user.age", type: "added", leftValue: undefined, rightValue: "number" },
  ],
  ...overrides,
});

describe("serializeDiff", () => {
  it("serialises to JSON", () => {
    const result = serializeDiff([makeEntry()], "json");
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].urlA).toBe("http://a.example.com/api");
  });

  it("serialises to CSV with header row", () => {
    const result = serializeDiff([makeEntry()], "csv");
    const lines = result.split("\n");
    expect(lines[0]).toBe("key,type,leftValue,rightValue,timestamp");
    expect(lines[1]).toContain("user.name");
    expect(lines[1]).toContain("changed");
  });

  it("CSV handles entry with no changes", () => {
    const result = serializeDiff([makeEntry({ diff: [] })], "csv");
    expect(result).toContain("(none)");
  });

  it("serialises to markdown with table", () => {
    const result = serializeDiff([makeEntry()], "markdown");
    expect(result).toContain("# Diff Export");
    expect(result).toContain("| Key | Type | Left | Right |");
    expect(result).toContain("user.name");
  });

  it("markdown handles entry with no changes", () => {
    const result = serializeDiff([makeEntry({ diff: [] })], "markdown");
    expect(result).toContain("_No differences found._");
  });

  it("throws on unsupported format", () => {
    expect(() => serializeDiff([], "xml" as ExportFormat)).toThrow("Unsupported export format");
  });
});
