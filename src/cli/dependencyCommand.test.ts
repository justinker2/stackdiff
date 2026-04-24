import { parseDependencyArgs, printDependencyUsage } from './dependencyCommand';

describe('parseDependencyArgs', () => {
  it('parses two URLs', () => {
    const args = parseDependencyArgs([
      'https://api.example.com/v1',
      'https://api.example.com/v2',
    ]);
    expect(args.urlA).toBe('https://api.example.com/v1');
    expect(args.urlB).toBe('https://api.example.com/v2');
    expect(args.json).toBe(false);
  });

  it('sets json flag when --json is present', () => {
    const args = parseDependencyArgs([
      'https://a.example.com',
      'https://b.example.com',
      '--json',
    ]);
    expect(args.json).toBe(true);
  });

  it('parses headers for both sides', () => {
    const args = parseDependencyArgs([
      'https://a.example.com',
      'https://b.example.com',
      '--header-a', 'Authorization:Bearer abc',
      '--header-b', 'X-Version:2',
    ]);
    expect(args.headersA['Authorization']).toBe('Bearer abc');
    expect(args.headersB['X-Version']).toBe('2');
  });
});

describe('printDependencyUsage', () => {
  it('prints without throwing', () => {
    expect(() => printDependencyUsage()).not.toThrow();
  });
});
