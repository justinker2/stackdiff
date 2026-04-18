import { formatAnnotation, formatAnnotationReport } from "./annotationFormatter";
import { Annotation } from "../diff/diffAnnotate";

const ann = (severity: Annotation["severity"], message: string): Annotation => ({
  path: "x",
  change: "added",
  severity,
  message,
});

describe("formatAnnotation", () => {
  it("includes the message", () => {
    const result = formatAnnotation(ann("info", "some info message"));
    expect(result).toContain("some info message");
  });

  it("includes an icon character", () => {
    const info = formatAnnotation(ann("info", "x"));
    const warn = formatAnnotation(ann("warning", "x"));
    const err = formatAnnotation(ann("error", "x"));
    expect(info).not.toBe(warn);
    expect(warn).not.toBe(err);
  });
});

describe("formatAnnotationReport", () => {
  it("returns no-diff message for empty list", () => {
    expect(formatAnnotationReport([])).toContain("No differences");
  });

  it("includes summary line", () => {
    const result = formatAnnotationReport([
      ann("error", "something removed"),
      ann("warning", "type changed"),
    ]);
    expect(result).toContain("Summary:");
    expect(result).toContain("1 error");
    expect(result).toContain("1 warning");
  });

  it("groups by severity with headers", () => {
    const result = formatAnnotationReport([ann("error", "bad")]);
    expect(result).toContain("ERRORS");
  });
});
