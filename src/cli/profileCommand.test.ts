import { parseProfileArgs, runProfileCommand } from "./profileCommand";
import * as profileLoader from "../config/profileLoader";
import * as saveProfile from "../config/saveProfile";

jest.mock("../config/profileLoader");
jest.mock("../config/saveProfile");

const mockGetProfile = profileLoader.getProfile as jest.MockedFunction<typeof profileLoader.getProfile>;
const mockListProfiles = saveProfile.listProfiles as jest.MockedFunction<typeof saveProfile.listProfiles>;
const mockSaveProfile = saveProfile.saveProfile as jest.MockedFunction<typeof saveProfile.saveProfile>;
const mockDeleteProfile = saveProfile.deleteProfile as jest.MockedFunction<typeof saveProfile.deleteProfile>;

describe("parseProfileArgs", () => {
  it("parses list action", () => {
    expect(parseProfileArgs(["list"])).toEqual({ action: "list", name: undefined, baseUrl: undefined, headers: {} });
  });

  it("parses add action with url and headers", () => {
    const result = parseProfileArgs(["add", "prod", "--url", "https://api.example.com", "--header", "Authorization: Bearer token"]);
    expect(result.action).toBe("add");
    expect(result.name).toBe("prod");
    expect(result.baseUrl).toBe("https://api.example.com");
    expect(result.headers).toEqual({ Authorization: "Bearer token" });
  });

  it("parses remove action", () => {
    expect(parseProfileArgs(["remove", "prod"])).toMatchObject({ action: "remove", name: "prod" });
  });

  it("throws on invalid action", () => {
    expect(() => parseProfileArgs(["invalid"])).toThrow();
  });

  it("throws when name missing for show", () => {
    expect(() => parseProfileArgs(["show"])).toThrow();
  });
});

describe("runProfileCommand", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists profiles", async () => {
    mockListProfiles.mockResolvedValue(["prod", "staging"]);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runProfileCommand({ action: "list" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("prod"));
    spy.mockRestore();
  });

  it("adds a profile", async () => {
    mockSaveProfile.mockResolvedValue(undefined);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runProfileCommand({ action: "add", name: "prod", baseUrl: "https://api.example.com", headers: {} });
    expect(mockSaveProfile).toHaveBeenCalledWith("prod", expect.objectContaining({ baseUrl: "https://api.example.com" }));
    spy.mockRestore();
  });

  it("removes a profile", async () => {
    mockDeleteProfile.mockResolvedValue(undefined);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runProfileCommand({ action: "remove", name: "prod" });
    expect(mockDeleteProfile).toHaveBeenCalledWith("prod");
    spy.mockRestore();
  });

  it("shows a profile", async () => {
    mockGetProfile.mockResolvedValue({ baseUrl: "https://api.example.com", headers: { Authorization: "Bearer x" } });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runProfileCommand({ action: "show", name: "prod" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("https://api.example.com"));
    spy.mockRestore();
  });
});
