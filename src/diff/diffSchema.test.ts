import { validateSchema, formatSchemaReport, DiffEntry, SchemaRule } from "./diffSchema";

const entries: DiffEntry[] = [
  { path: "user.id",    change: "unchanged", fromType: "number",  toType: "number" },
  { path: "user.name",  change: "changed",   fromType: "string",  toType: "number" },
  { path: "user.email", change: "removed",   fromType: "string" },
  { path: "order.total",change: "added",     toType: "string" },
];

describe("validateSchema", () => {
  it("returns no violations when all rules pass", () => {
    const rules: SchemaRule[] = [{ path: "user.id", type: "number" }];
    expect(validateSchema(entries, rules)).toHaveLength(0);
  });

  it("detects a type mismatch", () => {
    const rules: SchemaRule[] = [{ path: "user.name", type: "string" }];
    const v = validateSchema(entries, rules);
    expect(v).toHaveLength(1);
    expect(v[0].rule).toBe("type");
    expect(v[0].expected).toBe("string");
    expect(v[0].actual).toBe("number");
  });

  it("detects a required field that was removed", () => {
    const rules: SchemaRule[] = [{ path: "user.email", required: true }];
    const v = validateSchema(entries, rules);
    expect(v).toHaveLength(1);
    expect(v[0].rule).toBe("required");
  });

  it("supports glob patterns", () => {
    const rules: SchemaRule[] = [{ path: "user.*", type: "string" }];
    const v = validateSchema(entries, rules);
    // user.id (number) and user.name (number) both mismatch
    expect(v.length).toBeGreaterThanOrEqual(2);
  });

  it("does not flag removed entries for type rule", () => {
    const rules: SchemaRule[] = [{ path: "user.email", type: "string" }];
    const v = validateSchema(entries, rules);
    expect(v).toHaveLength(0);
  });

  it("accumulates multiple violations", () => {
    const rules: SchemaRule[] = [
      { path: "user.name", type: "string" },
      { path: "user.email", required: true },
    ];
    expect(validateSchema(entries, rules)).toHaveLength(2);
  });
});

describe("formatSchemaReport", () => {
  it("returns pass message when empty", () => {
    expect(formatSchemaReport([])).toMatch(/passed/);
  });

  it("lists violations with rule and path", () => {
    const rules: SchemaRule[] = [{ path: "user.name", type: "string" }];
    const v = validateSchema(entries, rules);
    const report = formatSchemaReport(v);
    expect(report).toMatch(/\[type\]/);
    expect(report).toMatch(/user\.name/);
    expect(report).toMatch(/string/);
  });
});
