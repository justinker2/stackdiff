import { parseArgs } from "./parseArgs";

const base = ["node", "stackdiff"];
const urlA = "https://api.example.com/v1/users";
const urlB = "https://api.example.com/v2/users";

describe("parseArgs", () => {
  it("parses two positional URLs", () => {
    const result = parseArgs([...base, urlA, urlB]);
    expect(result.urlA).toBe(urlA);
    expect(result.urlB).toBe(urlB);
    expect(result.output).toBe("text");
    expect(result.timeout).toBe(10000);
    expect(result.headers).toEqual({});
  });

  it("parses --header flags", () => {
    const result = parseArgs([...base, urlA, urlB, "-H", "Authorization: Bearer tok", "-H", "X-App: test"]);
    expect(result.headers).toEqual({
      Authorization: "Bearer tok",
      "X-App": "test",
    });
  });

  it("parses --output json", () => {
    const result = parseArgs([...base, urlA, urlB, "--output", "json"]);
    expect(result.output).toBe("json");
  });

  it("parses --timeout", () => {
    const result = parseArgs([...base, urlA, urlB, "--timeout", "5000"]);
    expect(result.timeout).toBe(5000);
  });

  it("throws when fewer than 2 URLs provided", () => {
    expect(() => parseArgs([...base, urlA])).toThrow("Usage:");
  });

  it("throws on invalid URL", () => {
    expect(() => parseArgs([...base, "not-a-url", urlB])).toThrow("Invalid URL");
  });

  it("throws on unknown flag", () => {
    expect(() => parseArgs([...base, urlA, urlB, "--unknown"])).toThrow("Unknown flag");
  });

  it("throws on invalid --output value", () => {
    expect(() => parseArgs([...base, urlA, urlB, "--output", "xml"])).toThrow("--output must be");
  });

  it("throws on malformed header", () => {
    expect(() => parseArgs([...base, urlA, urlB, "-H", "BadHeader"])).toThrow("Invalid header format");
  });
});
