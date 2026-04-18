import fs from "fs";
import path from "path";
import os from "os";

export interface EndpointProfile {
  name: string;
  url: string;
  headers?: Record<string, string>;
}

export interface StackDiffProfile {
  profiles: Record<string, EndpointProfile>;
}

const DEFAULT_CONFIG_PATH = path.join(os.homedir(), ".stackdiff", "config.json");

export function resolveConfigPath(override?: string): string {
  if (override) return path.resolve(override);
  const envPath = process.env.STACKDIFF_CONFIG;
  if (envPath) return path.resolve(envPath);
  return DEFAULT_CONFIG_PATH;
}

export function loadProfiles(configPath?: string): StackDiffProfile {
  const filePath = resolveConfigPath(configPath);
  if (!fs.existsSync(filePath)) {
    return { profiles: {} };
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.profiles !== "object") {
      throw new Error("Invalid config format: missing 'profiles' object");
    }
    return parsed as StackDiffProfile;
  } catch (err) {
    throw new Error(`Failed to load config from ${filePath}: ${(err as Error).message}`);
  }
}

export function getProfile(name: string, configPath?: string): EndpointProfile {
  const config = loadProfiles(configPath);
  const profile = config.profiles[name];
  if (!profile) {
    const available = Object.keys(config.profiles).join(", ") || "(none)";
    throw new Error(`Profile '${name}' not found. Available: ${available}`);
  }
  return profile;
}
