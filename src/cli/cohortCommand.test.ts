import { parseCohortArgs } from './cohortCommand';

describe('parseCohortArgs', () => {
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  const err  = jest.spyOn(console, 'error').mockImplementation(() => {});

  afterAll(() => { exit.mockRestore(); err.mockRestore(); });

  it('parses positional input file', () => {
    const args = parseCohortArgs(['node', 'stackdiff', 'entries.json']);
    expect(args.inputFile).toBe('entries.json');
    expect(args.json).toBe(false);
  });

  it('parses --input flag', () => {
    const args = parseCohortArgs(['node', 'stackdiff', '--input', 'data.json']);
    expect(args.inputFile).toBe('data.json');
  });

  it('parses --json flag', () => {
    const args = parseCohortArgs(['node', 'stackdiff', 'entries.json', '--json']);
    expect(args.json).toBe(true);
  });

  it('exits when no input file is provided', () => {
    expect(() => parseCohortArgs(['node', 'stackdiff'])).toThrow('exit');
    expect(err).toHaveBeenCalled();
  });
});
