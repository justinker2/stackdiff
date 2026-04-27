import { parseAuditArgs, runAuditCommand } from "./auditCommand";
import { DiffEntry } from "../diff/shapeDiff";

const removed: DiffEntry = { path: "a.b", change: "removed", from: "string", to: undefined };
const added: DiffEntry = { path: "a.c", change: "added", from: undefined, to: "number" };
const unchanged: DiffEntry = { path: "a.d", change: "unchanged", from: "boolean", to: "boolean" };

describe("parseAuditArgs", () => {
  it("returns defaults with no args", () => {
    const args = parseAuditArgs([]);
    expect(args.minSeverity).toBe("info");
    expect(args.failOn).toBe("error");
    expect(args.json).toBe(false);
  });

  it("parses --min-severity", () => {
    const args = parseAuditArgs(["--min-severity", "warn"]);
    expect(args.minSeverity).toBe("warn");
  });

  it("parses --fail-on none", () => {
    const args = parseAuditArgs(["--fail-on", "none"]);
    expect(args.failOn).toBeNull();
  });

  it("parses --fail-on warn", () => {
    const args = parseAuditArgs(["--fail-on", "warn"]);
    expect(args.failOn).toBe("warn");
  });

  it("parses --json flag", () => {
    const args = parseAuditArgs(["--json"]);
    expect(args.json).toBe(true);
  });
});

describe("runAuditCommand", () => {
  it("returns exitCode 0 when no violations match failOn", () => {
    const { exitCode } = runAuditCommand([unchanged], ["--fail-on", "error"]);
    expect(exitCode).toBe(0);
  });

  it("returns exitCode 1 when error violation present", () => {
    const { exitCode } = runAuditCommand([removed], []);
    expect(exitCode).toBe(1);
  });

  it("returns exitCode 0 when failOn is none", () => {
    const { exitCode } = runAuditCommand([removed], ["--fail-on", "none"]);
    expect(exitCode).toBe(0);
  });

  it("filters violations below minSeverity", () => {
    const { output } = runAuditCommand([added], ["--min-severity", "warn"]);
    expect(output).toContain("✅");
  });

  it("outputs JSON when --json is passed", () => {
    const { output } = runAuditCommand([removed], ["--json"]);
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty("violations");
    expect(Array.isArray(parsed.violations)).toBe(true);
  });

  it("includes violation path in text output", () => {
    const { output } = runAuditCommand([removed], []);
    expect(output).toContain("a.b");
  });
});
