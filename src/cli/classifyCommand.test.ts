import { parseClassifyArgs } from './classifyCommand';

describe('parseClassifyArgs', () => {
  const base = [
    'https://api.example.com/v1',
    'https://api.example.com/v2',
  ];

  it('parses urls from positional args', () => {
    const args = parseClassifyArgs(base);
    expect(args.urlA).toBe('https://api.example.com/v1');
    expect(args.urlB).toBe('https://api.example.com/v2');
  });

  it('defaults json to false', () => {
    const args = parseClassifyArgs(base);
    expect(args.json).toBe(false);
  });

  it('sets json to true when --json flag present', () => {
    const args = parseClassifyArgs([...base, '--json']);
    expect(args.json).toBe(true);
  });

  it('parses headers for urlA', () => {
    const args = parseClassifyArgs([
      ...base,
      '--header-a',
      'Authorization: Bearer tok',
    ]);
    expect(args.headersA['Authorization']).toBe('Bearer tok');
  });

  it('parses headers for urlB', () => {
    const args = parseClassifyArgs([
      ...base,
      '--header-b',
      'X-Api-Key: secret',
    ]);
    expect(args.headersB['X-Api-Key']).toBe('secret');
  });
});
