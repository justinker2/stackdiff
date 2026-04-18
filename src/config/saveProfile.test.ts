import fs from "fs";
import { saveProfile, deleteProfile, listProfiles } from "./saveProfile";
import { loadProfiles } from "./profileLoader";

jest.mock("fs");
jest.mock("./profileLoader");

const mockFs = fs as jest.Mocked<typeof fs>;
const mockLoadProfiles = loadProfiles as jest.MockedFunction<typeof loadProfiles>;

const existingConfig = {
  profiles: {
    prod: { name: "prod", url: "https://prod.example.com" },
  },
};

beforeEach(() => {
  jest.resetAllMocks();
  mockFs.existsSync.mockReturnValue(true);
  mockLoadProfiles.mockReturnValue(existingConfig);
});

describe("saveProfile", () => {
  it("writes merged config with new profile", () => {
    saveProfile({ name: "staging", url: "https://staging.example.com" }, "/cfg.json");
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
    const written = JSON.parse((mockFs.writeFileSync as jest.Mock).mock.calls[0][1]);
    expect(written.profiles.staging.url).toBe("https://staging.example.com");
    expect(written.profiles.prod).toBeDefined();
  });

  it("creates directory if missing", () => {
    mockFs.existsSync.mockReturnValue(false);
    saveProfile({ name: "dev", url: "https://dev.example.com" }, "/new/cfg.json");
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });
});

describe("deleteProfile", () => {
  it("returns false if config file missing", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(deleteProfile("prod", "/cfg.json")).toBe(false);
  });

  it("returns false if profile not found", () => {
    expect(deleteProfile("ghost", "/cfg.json")).toBe(false);
  });

  it("removes profile and writes updated config", () => {
    expect(deleteProfile("prod", "/cfg.json")).toBe(true);
    const written = JSON.parse((mockFs.writeFileSync as jest.Mock).mock.calls[0][1]);
    expect(written.profiles.prod).toBeUndefined();
  });
});

describe("listProfiles", () => {
  it("returns array of profiles", () => {
    const result = listProfiles("/cfg.json");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("prod");
  });
});
