import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadAliasProfiles,
  saveAliasProfile,
  getAliasProfile,
  deleteAliasProfile,
  listAliasProfiles,
} from './aliasProfile';

jest.mock('./profileLoader', () => ({
  resolveConfigPath: () => tmpDir,
}));

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-alias-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadAliasProfiles', () => {
  it('returns empty array when file does not exist', () => {
    expect(loadAliasProfiles()).toEqual([]);
  });
});

describe('saveAliasProfile / getAliasProfile', () => {
  it('saves and retrieves a profile', () => {
    saveAliasProfile({ name: 'default', rules: [{ pattern: 'user.*', alias: 'User' }] });
    const profile = getAliasProfile('default');
    expect(profile).toBeDefined();
    expect(profile!.rules).toHaveLength(1);
  });

  it('overwrites existing profile with same name', () => {
    saveAliasProfile({ name: 'default', rules: [{ pattern: 'a', alias: 'A' }] });
    saveAliasProfile({ name: 'default', rules: [{ pattern: 'b', alias: 'B' }] });
    const profiles = loadAliasProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].rules[0].alias).toBe('B');
  });
});

describe('deleteAliasProfile', () => {
  it('removes a profile and returns true', () => {
    saveAliasProfile({ name: 'temp', rules: [] });
    expect(deleteAliasProfile('temp')).toBe(true);
    expect(getAliasProfile('temp')).toBeUndefined();
  });

  it('returns false when profile does not exist', () => {
    expect(deleteAliasProfile('nonexistent')).toBe(false);
  });
});

describe('listAliasProfiles', () => {
  it('returns names of all saved profiles', () => {
    saveAliasProfile({ name: 'alpha', rules: [] });
    saveAliasProfile({ name: 'beta', rules: [] });
    expect(listAliasProfiles()).toEqual(expect.arrayContaining(['alpha', 'beta']));
  });
});
