import { loadProfiles, getProfile } from "../config/profileLoader";
import { saveProfile, deleteProfile, listProfiles } from "../config/saveProfile";

export type ProfileAction = "list" | "add" | "remove" | "show";

export interface ProfileCommandArgs {
  action: ProfileAction;
  name?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export function parseProfileArgs(argv: string[]): ProfileCommandArgs {
  const [action, name, ...rest] = argv;

  if (!action || !["list", "add", "remove", "show"].includes(action)) {
    throw new Error(`Invalid profile action: "${action}". Use list, add, remove, or show.`);
  }

  if ((action === "add" || action === "remove" || action === "show") && !name) {
    throw new Error(`Profile name is required for action "${action}".`);
  }

  let baseUrl: string | undefined;
  const headers: Record<string, string> = {};

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--url" && rest[i + 1]) {
      baseUrl = rest[++i];
    } else if (rest[i] === "--header" && rest[i + 1]) {
      const [key, value] = rest[++i].split(":");
      if (key && value !== undefined) headers[key.trim()] = value.trim();
    }
  }

  return { action: action as ProfileAction, name, baseUrl, headers };
}

export async function runProfileCommand(args: ProfileCommandArgs): Promise<void> {
  switch (args.action) {
    case "list": {
      const names = await listProfiles();
      if (names.length === 0) {
        console.log("No profiles saved.");
      } else {
        console.log("Saved profiles:");
        names.forEach((n) => console.log(`  - ${n}`));
      }
      break;
    }
    case "add": {
      if (!args.name || !args.baseUrl) {
        throw new Error("--url is required when adding a profile.");
      }
      await saveProfile(args.name, { baseUrl: args.baseUrl, headers: args.headers ?? {} });
      console.log(`Profile "${args.name}" saved.`);
      break;
    }
    case "remove": {
      await deleteProfile(args.name!);
      console.log(`Profile "${args.name}" removed.`);
      break;
    }
    case "show": {
      const profile = await getProfile(args.name!);
      console.log(`Profile "${args.name}":\n  baseUrl: ${profile.baseUrl}`);
      if (Object.keys(profile.headers ?? {}).length > 0) {
        console.log("  headers:");
        for (const [k, v] of Object.entries(profile.headers!)) {
          console.log(`    ${k}: ${v}`);
        }
      }
      break;
    }
  }
}
