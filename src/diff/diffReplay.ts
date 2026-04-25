import { DiffEntry } from './shapeDiff';

export interface ReplayOptions {
  delay?: number; // ms between steps
  filter?: (entry: DiffEntry, index: number) => boolean;
}

export interface ReplayStep {
  index: number;
  entry: DiffEntry;
  timestamp: number;
}

export function buildReplaySteps(
  entries: DiffEntry[],
  options: ReplayOptions = {}
): ReplayStep[] {
  const { filter } = options;
  return entries
    .filter((entry, i) => (filter ? filter(entry, i) : true))
    .map((entry, i) => ({
      index: i,
      entry,
      timestamp: Date.now() + i * (options.delay ?? 0),
    }));
}

export async function replayDiff(
  entries: DiffEntry[],
  onStep: (step: ReplayStep) => void,
  options: ReplayOptions = {}
): Promise<void> {
  const steps = buildReplaySteps(entries, options);
  const delay = options.delay ?? 0;
  for (const step of steps) {
    onStep(step);
    if (delay > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }
}

export function formatReplayReport(steps: ReplayStep[]): string {
  if (steps.length === 0) return 'No replay steps.';
  const lines: string[] = [`Replay: ${steps.length} step(s)`, ''];
  for (const step of steps) {
    const { index, entry } = step;
    lines.push(`  [${index + 1}] ${entry.path}  (${entry.change})`);
    if (entry.from !== undefined) lines.push(`        from: ${entry.from}`);
    if (entry.to !== undefined) lines.push(`        to:   ${entry.to}`);
  }
  return lines.join('\n');
}
