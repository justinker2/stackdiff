import {
  patternToRegex,
  shouldRedact,
  redactEntry,
  redactDiff,
  formatRedactSummary,
} from "./diffRedact";
import type { DiffEntry } from "./shapeDiff";

const makeEntry = (path: string, prev?: string, curr?: string): DiffEntry => ({
  path,
  change: "modified",
  previousValue: prev,
  currentValue: curr,
});

describe("patternToRegex", () => {
  it("converts a glob-style pattern to regex", () => {
    const re = patternToRegex("user*");
    expect(re.test("username")).toBe(true);
    expect(re.test("email")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(patternToRegex("Token").test("token")).toBe(true);
  });
});

describe("shouldRedact", () => {
  it("matches built-in sensitive patterns via custom list", () => {
    const patterns = [/password/i, /token/i];
    expect(shouldRedact("user.password", patterns)).toBe(true);
    expect(shouldRedact("user.email", patterns)).toBe(false);
  });

  it("uses the last path segment for matching", () => {
    expect(shouldRedact("deeply.nested.apiKey", [/apikey/i])).toBe(true);
  });
});

describe("redactEntry", () => {
  it("replaces values for sensitive fields", () => {
    const entry = makeEntry("user.token", "abc123", "xyz789");
    const result = redactEntry(entry, [/token/i], "[REDACTED]");
    expect(result.previousValue).toBe("[REDACTED]");
    expect(result.currentValue).toBe("[REDACTED]");
  });

  it("leaves non-sensitive fields unchanged", () => {
    const entry = makeEntry("user.email", "a@b.com", "c@d.com");
    const result = redactEntry(entry, [/token/i], "[REDACTED]");
    expect(result.previousValue).toBe("a@b.com");
    expect(result.currentValue).toBe("c@d.com");
  });
});

describe("redactDiff", () => {
  it("applies built-in patterns automatically", () => {
    const entries = [
      makeEntry("user.password", "secret", "newsecret"),
      makeEntry("user.name", "Alice", "Bob"),
    ];
    const result = redactDiff(entries);
    expect(result[0].previousValue).toBe("[REDACTED]");
    expect(result[1].previousValue).toBe("Alice");
  });

  it("supports custom patterns and placeholder", () => {
    const entries = [makeEntry("data.internalId", "1", "2")];
    const result = redactDiff(entries, { patterns: ["internalId"], placeholder: "***" });
    expect(result[0].currentValue).toBe("***");
  });
});

describe("formatRedactSummary", () => {
  it("reports the number of redacted fields", () => {
    const original = [makeEntry("a.token", "x", "y"), makeEntry("a.name", "Alice", "Bob")];
    const redacted = redactDiff(original);
    const summary = formatRedactSummary(original, redacted);
    expect(summary).toMatch(/Redacted 1 of 2/);
  });
});
