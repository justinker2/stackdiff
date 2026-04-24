import { parseBreakingArgs } from "./breakingCommand";

describe("parseBreakingArgs", () => {
  const base = ["https://api.example.com/v1", "https://api.example.com/v2"];

  it("parses basic urls", () => {
    const args = parseBreakingArgs(base);
    expect(args.urlA).toBe(base[0]);
    expect(args.urlB).toBe(base[1]);
  });

  it("defaults failOnBreaking to false", () => {
    const args = parseBreakingArgs(base);
    expect(args.failOnBreaking).toBe(false);
  });

  it("sets failOnBreaking when flag present", () => {
    const args = parseBreakingArgs([...base, "--fail-on-breaking"]);
    expect(args.failOnBreaking).toBe(true);
  });

  it("defaults jsonOutput to false", () => {
    const args = parseBreakingArgs(base);
    expect(args.jsonOutput).toBe(false);
  });

  it("sets jsonOutput when flag present", () => {
    const args = parseBreakingArgs([...base, "--json"]);
    expect(args.jsonOutput).toBe(true);
  });

  it("parses headers alongside flags", () => {
    const args = parseBreakingArgs([
      ...base,
      "--header-a",
      "Authorization:Bearer token",
      "--fail-on-breaking",
    ]);
    expect(args.headersA["Authorization"]).toBe("Bearer token");
    expect(args.failOnBreaking).toBe(true);
  });
});
