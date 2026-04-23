import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  saveDeprecationProfile,
  getDeprecationProfile,
  deleteDeprecationProfile,
  listDeprecationProfiles,
} from './deprecationProfile';

const DEPRECATION_FILE = path.join(os.homedir(), '.stackdiff', 'deprecations.json');

beforeEach(() => {
  if (fs.existsSync(DEPRECATION_FILE)) fs.unlinkSync(DEPRECATION_FILE);
});

afterAll(() => {
  if (fs.existsSync(DEPRECATION_FILE)) fs.unlinkSync(DEPRECATION_FILE);
});

describe('saveDeprecationProfile / getDeprecationProfile', () => {
  it('saves and retrieves a profile', () => {
    saveDeprecationProfile({ name: 'v2', rules: [{ pattern: 'user.old_id', reason: 'deprecated' }] });
    const profile = getDeprecationProfile('v2');
    expect(profile).toBeDefined();
    expect(profile!.rules).toHaveLength(1);
    expect(profile!.rules[0].pattern).toBe('user.old_id');
  });

  it('returns undefined for unknown profile', () => {
    expect(getDeprecationProfile('nonexistent')).toBeUndefined();
  });

  it('overwrites existing profile', () => {
    saveDeprecationProfile({ name: 'v2', rules: [{ pattern: 'a' }] });
    saveDeprecationProfile({ name: 'v2', rules: [{ pattern: 'b' }, { pattern: 'c' }] });
    expect(getDeprecationProfile('v2')!.rules).toHaveLength(2);
  });
});

describe('deleteDeprecationProfile', () => {
  it('deletes an existing profile and returns true', () => {
    saveDeprecationProfile({ name: 'temp', rules: [] });
    expect(deleteDeprecationProfile('temp')).toBe(true);
    expect(getDeprecationProfile('temp')).toBeUndefined();
  });

  it('returns false when profile does not exist', () => {
    expect(deleteDeprecationProfile('ghost')).toBe(false);
  });
});

describe('listDeprecationProfiles', () => {
  it('returns empty array when no profiles', () => {
    expect(listDeprecationProfiles()).toEqual([]);
  });

  it('lists all saved profiles', () => {
    saveDeprecationProfile({ name: 'alpha', rules: [] });
    saveDeprecationProfile({ name: 'beta', rules: [] });
    const list = listDeprecationProfiles();
    expect(list).toContain('alpha');
    expect(list).toContain('beta');
  });
});
