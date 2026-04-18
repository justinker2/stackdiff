import { parseMergeArgs } from './mergeCommand';

describe('parseMergeArgs', () => {
  it('parses base and incoming labels', () => {
    const args = parseMergeArgs(['v1', 'v2']);
    expect(args.baseLabel).toBe('v1');
    expect(args.incomingLabel).toBe('v2');
    expect(args.verbose).toBe(false);
  });

  it('parses verbose flag', () => {
    const args = parseMergeArgs(['v1', 'v2', '--verbose']);
    expect(args.verbose).toBe(true);
  });

  it('throws when labels are missing', () => {
    expect(() => parseMergeArgs([])).toThrow('Usage:');
    expect(() => parseMergeArgs(['v1'])).toThrow('Usage:');
  });
});
