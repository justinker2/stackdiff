/**
 * Persist and retrieve deprecation rule sets (profiles) to disk.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import type { DeprecationRule } from '../diff/diffDeprecate';

const CONFIG_DIR = path.join(os.homedir(), '.stackdiff');
const DEPRECATION_FILE = path.join(CONFIG_DIR, 'deprecations.json');

export interface DeprecationProfile {
  name: string;
  rules: DeprecationRule[];
}

type ProfileStore = Record<string, DeprecationProfile>;

function loadStore(): ProfileStore {
  if (!fs.existsSync(DEPRECATION_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DEPRECATION_FILE, 'utf-8')) as ProfileStore;
  } catch {
    return {};
  }
}

function saveStore(store: ProfileStore): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(DEPRECATION_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

export function saveDeprecationProfile(profile: DeprecationProfile): void {
  const store = loadStore();
  store[profile.name] = profile;
  saveStore(store);
}

export function getDeprecationProfile(name: string): DeprecationProfile | undefined {
  return loadStore()[name];
}

export function deleteDeprecationProfile(name: string): boolean {
  const store = loadStore();
  if (!store[name]) return false;
  delete store[name];
  saveStore(store);
  return true;
}

export function listDeprecationProfiles(): string[] {
  return Object.keys(loadStore());
}
