/**
 * aliasProfile.ts — load and save alias rules as part of a named profile
 */

import * as fs from 'fs';
import * as path from 'path';
import { AliasRule } from '../diff/diffAlias';
import { resolveConfigPath } from './profileLoader';

const ALIAS_FILE = 'aliases.json';

export interface AliasProfile {
  name: string;
  rules: AliasRule[];
}

function aliasFilePath(): string {
  return path.join(resolveConfigPath(), ALIAS_FILE);
}

export function loadAliasProfiles(): AliasProfile[] {
  const filePath = aliasFilePath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as AliasProfile[];
  } catch {
    return [];
  }
}

export function saveAliasProfile(profile: AliasProfile): void {
  const profiles = loadAliasProfiles().filter((p) => p.name !== profile.name);
  profiles.push(profile);
  fs.writeFileSync(aliasFilePath(), JSON.stringify(profiles, null, 2));
}

export function getAliasProfile(name: string): AliasProfile | undefined {
  return loadAliasProfiles().find((p) => p.name === name);
}

export function deleteAliasProfile(name: string): boolean {
  const profiles = loadAliasProfiles();
  const filtered = profiles.filter((p) => p.name !== name);
  if (filtered.length === profiles.length) return false;
  fs.writeFileSync(aliasFilePath(), JSON.stringify(filtered, null, 2));
  return true;
}

export function listAliasProfiles(): string[] {
  return loadAliasProfiles().map((p) => p.name);
}
