import fs from "fs";
import os from "os";
import path from "path";
import { loadProfiles, getProfile, resolveConfigPath } from "./profileLoader";

jest.mock("fs");

const mockFs = fs as jest.Mocked<typeof fs>;

const sampleConfig = {
  profiles: {
    prod: { name: "prod", url: "https://api.prod.example.com", headers: { Authorization: "Bearer token" } },
    staging: { name: "staging", url: "https://api.staging.example.com" },
  },
};

beforeEach(() => {
  jest.resetAllMocks();
  delete process.env.STACKDIFF_CONFIG;
});

describe("resolveConfigPath", () => {
  it("returns override path when provided", () => {
    expect(resolveConfigPath("/custom/path.json")).toBe("/custom/path.json");
  });

  it("uses STACKDIFF_CONFIG env var", () => {
    process.env.STACKDIFF_CONFIG = "/env/config.json";
    expect(resolveConfigPath()).toBe("/env/config.json");
  });

  it("falls back to home directory default", () => {
    const result = resolveConfigPath();
    expect(result).toContain(".stackdiff");
    expect(result).toContain("config.json");
  });
});

describe("loadProfiles", () => {
  it("returns empty profiles if file does not exist", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(loadProfiles("/no/file.json")).toEqual({ profiles: {} });
  });

  it("parses valid config file", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(sampleConfig) as any);
    expect(loadProfiles("/valid.json")).toEqual(sampleConfig);
  });

  it("throws on malformed JSON", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("not json" as any);
    expect(() => loadProfiles("/bad.json")).toThrow("Failed to load config");
  });
});

describe("getProfile", () => {
  beforeEach(() => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(sampleConfig) as any);
  });

  it("returns a known profile", () => {
    expect(getProfile("prod", "/cfg.json").url).toBe("https://api.prod.example.com");
  });

  it("throws for unknown profile with list of available", () => {
    expect(() => getProfile("dev", "/cfg.json")).toThrow("prod, staging");
  });
});
