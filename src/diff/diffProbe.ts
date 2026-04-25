/**
 * diffProbe: detect fields that appear in one response but are consistently
 * absent (or null/undefined) in another — potential "probe" or canary fields.
 */

import type { DiffEntry } from './shapeDiff';

export interface ProbeEntry {
  path: string;
  kind: 'added' | 'removed';
  depth: number;
  note: string;
}

export interface ProbeResult {
  probes: ProbeEntry[];
  total: number;
}

function pathDepth(path: string): number {
  return path.split('.').filter(Boolean).length;
}

export function detectProbes(
  entries: DiffEntry[],
  opts: { maxDepth?: number; kinds?: Array<'added' | 'removed'> } = {}
): ProbeResult {
  const { maxDepth = Infinity, kinds = ['added', 'removed'] } = opts;

  const probes: ProbeEntry[] = entries
    .filter((e) => kinds.includes(e.change as 'added' | 'removed'))
    .filter((e) => pathDepth(e.path) <= maxDepth)
    .map((e) => ({
      path: e.path,
      kind: e.change as 'added' | 'removed',
      depth: pathDepth(e.path),
      note:
        e.change === 'added'
          ? `Field present in target but missing in source`
          : `Field present in source but missing in target`,
    }));

  return { probes, total: probes.length };
}

export function formatProbeReport(result: ProbeResult): string {
  if (result.total === 0) {
    return 'No probe fields detected.';
  }

  const lines: string[] = [`Probe fields detected: ${result.total}`, ''];

  for (const p of result.probes) {
    const tag = p.kind === 'added' ? '[+]' : '[-]';
    lines.push(`  ${tag} ${p.path}  (depth ${p.depth})`);
    lines.push(`       ${p.note}`);
  }

  return lines.join('\n');
}
