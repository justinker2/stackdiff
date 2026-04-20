import { parseSnapshotArgs } from "./snapshotCommand";

describe("parseSnapshotArgs", () => {
  it("parses list subcommand", () => {
    const args = parseSnapshotArgs(["list"]);
    expect(args.subcommand).toBe("list");
  });

  it("parses delete with --name", () => {
    const args = parseSnapshotArgs(["delete", "--name", "my-snap"]);
    expect(args.subcommand).toBe("delete");
    expect(args.name).toBe("my-snap");
  });

  it("parses load with --name", () => {
    const args = parseSnapshotArgs(["load", "--name", "baseline"]);
    expect(args.subcommand).toBe("load");
    expect(args.name).toBe("baseline");
  });

  it("parses save with --name and two URLs", () => {
    const args = parseSnapshotArgs([
      "save",
      "--name",
      "v1",
      "http://localhost:3000/api",
      "http://localhost:4000/api",
    ]);
    expect(args.subcommand).toBe("save");
    expect(args.name).toBe("v1");
    expect(args.url1).toBe("http://localhost:3000/api");
    expect(args.url2).toBe("http://localhost:4000/api");
  });

  it("parses compare with --name and --compare-to", () => {
    const args = parseSnapshotArgs(["compare", "--name", "snap-a", "--compare-to", "snap-b"]);
    expect(args.subcommand).toBe("compare");
    expect(args.name).toBe("snap-a");
    expect(args.compareTo).toBe("snap-b");
  });

  it("throws when no subcommand provided", () => {
    expect(() => parseSnapshotArgs([])).toThrow("snapshot subcommand required");
  });
});
