import fs from "fs";
import path from "path";
import { resolveConfigPath, loadProfiles, EndpointProfile, StackDiffProfile } from "./profileLoader";

export function saveProfile(profile: EndpointProfile, configPath?: string): void {
  const filePath = resolveConfigPath(configPath);
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let existing: StackDiffProfile = { profiles: {} };
  if (fs.existsSync(filePath)) {
    existing = loadProfiles(configPath);
  }

  existing.profiles[profile.name] = profile;

  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf-8");
}

export function deleteProfile(name: string, configPath?: string): boolean {
  const filePath = resolveConfigPath(configPath);
  if (!fs.existsSync(filePath)) return false;

  const config = loadProfiles(configPath);
  if (!config.profiles[name]) return false;

  delete config.profiles[name];
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
  return true;
}

export function listProfiles(configPath?: string): EndpointProfile[] {
  const config = loadProfiles(configPath);
  return Object.values(config.profiles);
}
