import { auditDiff, formatAuditReport, AuditRule } from "./diffAudit";
import { DiffEntry } from "./shapeDiff";

const added: DiffEntry = { path: "user.email", change: "added", from: undefined, to: "string" };
const removed: DiffEntry = { path: "user.id", change: "removed", from: "number", to: undefined };
const changed: DiffEntry = { path: "user.age", change: "changed", from: "number", to: "string" };
const widened: DiffEntry = { path: "user.role", change: "changed", from: "string", to: "any" };
const unchanged: DiffEntry = { path: "user.name", change: "unchanged", from: "string", to: "string" };

describe("auditDiff", () => {
  it("returns no violations for unchanged entries", () => {
    const result = auditDiff([unchanged]);
    expect(result.violations).toHaveLength(0);
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("flags removed fields as error", () => {
    const result = auditDiff([removed]);
    const v = result.violations.find((v) => v.ruleId === "no-required-removal");
    expect(v).toBeDefined();
    expect(v?.severity).toBe("error");
    expect(v?.path).toBe("user.id");
  });

  it("flags type widening as error", () => {
    const result = auditDiff([widened]);
    const v = result.violations.find((v) => v.ruleId === "no-type-widening");
    expect(v).toBeDefined();
    expect(v?.severity).toBe("error");
  });

  it("flags type change as warn", () => {
    const result = auditDiff([changed]);
    const v = result.violations.find((v) => v.ruleId === "warn-type-change");
    expect(v).toBeDefined();
    expect(v?.severity).toBe("warn");
  });

  it("flags added fields as info", () => {
    const result = auditDiff([added]);
    const v = result.violations.find((v) => v.ruleId === "info-new-field");
    expect(v).toBeDefined();
    expect(v?.severity).toBe("info");
  });

  it("counts passed entries correctly across mixed input", () => {
    const result = auditDiff([unchanged, added, removed]);
    expect(result.passed).toBe(1);
  });

  it("supports custom rules", () => {
    const customRule: AuditRule = {
      id: "no-added",
      description: "No additions allowed",
      severity: "error",
      check: (e) => e.change === "added",
    };
    const result = auditDiff([added], [customRule]);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].ruleId).toBe("no-added");
  });
});

describe("formatAuditReport", () => {
  it("shows pass message when no violations", () => {
    const result = auditDiff([unchanged]);
    const report = formatAuditReport(result);
    expect(report).toContain("✅");
    expect(report).toContain("no violations");
  });

  it("shows violation summary on failure", () => {
    const result = auditDiff([removed, widened]);
    const report = formatAuditReport(result);
    expect(report).toContain("❌");
    expect(report).toContain("ERROR");
    expect(report).toContain("no-required-removal");
    expect(report).toContain("no-type-widening");
  });

  it("groups by severity order", () => {
    const result = auditDiff([added, changed]);
    const report = formatAuditReport(result);
    const warnIdx = report.indexOf("WARN");
    const infoIdx = report.indexOf("INFO");
    expect(warnIdx).toBeLessThan(infoIdx);
  });
});
