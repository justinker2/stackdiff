import {
  buildReplaySteps,
  replayDiff,
  formatReplayReport,
  ReplayStep,
} from './diffReplay';
import { DiffEntry } from './shapeDiff';

const makeEntry = (path: string, change: DiffEntry['change']): DiffEntry => ({
  path,
  change,
  from: change === 'removed' || change === 'changed' ? 'string' : undefined,
  to: change === 'added' || change === 'changed' ? 'number' : undefined,
});

describe('buildReplaySteps', () => {
  it('returns one step per entry', () => {
    const entries = [makeEntry('a.b', 'added'), makeEntry('a.c', 'removed')];
    const steps = buildReplaySteps(entries);
    expect(steps).toHaveLength(2);
    expect(steps[0].index).toBe(0);
    expect(steps[1].index).toBe(1);
  });

  it('applies filter option', () => {
    const entries = [
      makeEntry('a', 'added'),
      makeEntry('b', 'removed'),
      makeEntry('c', 'changed'),
    ];
    const steps = buildReplaySteps(entries, {
      filter: (e) => e.change !== 'removed',
    });
    expect(steps).toHaveLength(2);
    expect(steps.every((s) => s.entry.change !== 'removed')).toBe(true);
  });

  it('attaches timestamp to each step', () => {
    const entries = [makeEntry('x', 'added')];
    const steps = buildReplaySteps(entries, { delay: 100 });
    expect(typeof steps[0].timestamp).toBe('number');
  });
});

describe('replayDiff', () => {
  it('calls onStep for each entry in order', async () => {
    const entries = [makeEntry('a', 'added'), makeEntry('b', 'removed')];
    const received: ReplayStep[] = [];
    await replayDiff(entries, (step) => received.push(step));
    expect(received).toHaveLength(2);
    expect(received[0].entry.path).toBe('a');
    expect(received[1].entry.path).toBe('b');
  });

  it('respects filter via options', async () => {
    const entries = [makeEntry('a', 'added'), makeEntry('b', 'changed')];
    const received: ReplayStep[] = [];
    await replayDiff(entries, (s) => received.push(s), {
      filter: (e) => e.change === 'changed',
    });
    expect(received).toHaveLength(1);
    expect(received[0].entry.path).toBe('b');
  });
});

describe('formatReplayReport', () => {
  it('shows empty message for no steps', () => {
    expect(formatReplayReport([])).toBe('No replay steps.');
  });

  it('includes path and change for each step', () => {
    const entries = [makeEntry('data.id', 'added')];
    const steps = buildReplaySteps(entries);
    const report = formatReplayReport(steps);
    expect(report).toContain('data.id');
    expect(report).toContain('added');
    expect(report).toContain('1 step(s)');
  });

  it('includes from/to when present', () => {
    const entries = [makeEntry('data.count', 'changed')];
    const steps = buildReplaySteps(entries);
    const report = formatReplayReport(steps);
    expect(report).toContain('from:');
    expect(report).toContain('to:');
  });
});
