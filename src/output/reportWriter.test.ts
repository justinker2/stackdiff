import { buildReport, writeReport, DiffReport } from "./reportWriter";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const rawChanges = {
  "user.name": { before: "string", after: undefined },
  "user.age": { before: undefined, after: "number" },
  "user.email": { before: "string", after: "number" },
};

describe("buildReport", () => {
  it("classifies added, removed, and changed keys", () => {
    const report = buildReport("http://a.com", "http://b.com", [], rawChanges);
    const byKey = Object.fromEntries(report.changes.map((c) => [c.key, c]));

    expect(byKey["user.name"].change).toBe("removed");
    expect(byKey["user.age"].change).toBe("added");
    expect(byKey["user.email"].change).toBe("changed");
  });

  it("computes summary counts correctly", () => {
    const report = buildReport("http://a.com", "http://b.com", [], rawChanges);
    expect(report.summary.added).toBe(1);
    expect(report.summary.removed).toBe(1);
    expect(report.summary.changed).toBe(1);
  });

  it("includes urls and a timestamp", () => {
    const report = buildReport("http://a.com", "http://b.com", [], {});
    expect(report.urlA).toBe("http://a.com");
    expect(report.urlB).toBe("http://b.com");
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("writeReport", () => {
  it("returns JSON string when format is json", () => {
    const report = buildReport("http://a.com", "http://b.com", [], rawChanges);
    const out = writeReport(report, { format: "json" });
    const parsed = JSON.parse(out);
    expect(parsed.summary.added).toBe(1);
  });

  it("returns text string when format is text", () => {
    const report = buildReport("http://a.com", "http://b.com", [], rawChanges);
    const out = writeReport(report, { format: "text" });
    expect(out).toContain("Summary:");
    expect(out).toContain("user.email");
  });

  it("writes file to disk when outputPath is provided", () => {
    const report = buildReport("http://a.com", "http://b.com", [], rawChanges);
    const tmpFile = path.join(os.tmpdir(), `stackdiff-test-${Date.now()}.json`);
    writeReport(report, { format: "json", outputPath: tmpFile });
    const content = fs.readFileSync(tmpFile, "utf-8");
    expect(JSON.parse(content).urlA).toBe("http://a.com");
    fs.unlinkSync(tmpFile);
  });
});
