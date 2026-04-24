/**
 * diffDependency.ts
 * Detect and report field dependency relationships across diff entries.
 * A dependency exists when one field's presence correlates with another.
 */

import type { DiffEntry } from './diffFilter';

export interface DependencyPair {
  source: string;
  target: string;
  type: 'added-together' | 'removed-together' | 'inverse';
}

export interface DependencyReport {
  pairs: DependencyPair[];
  orphans: string[];
}

function parentOf(path: string): string {
  const parts = path.split('.');
  return parts.slice(0, -1).join('.');
}

export function detectDependencies(entries: DiffEntry[]): DependencyReport {
  const added = new Set(entries.filter(e => e.change === 'added').map(e => e.path));
  const removed = new Set(entries.filter(e => e.change === 'removed').map(e => e.path));

  const pairs: DependencyPair[] = [];
  const paired = new Set<string>();

  for (const a of added) {
    for (const b of added) {
      if (a >= b) continue;
      if (parentOf(a) === parentOf(b)) {
        pairs.push({ source: a, target: b, type: 'added-together' });
        paired.add(a);
        paired.add(b);
      }
    }
  }

  for (const a of removed) {
    for (const b of removed) {
      if (a >= b) continue;
      if (parentOf(a) === parentOf(b)) {
        pairs.push({ source: a, target: b, type: 'removed-together' });
        paired.add(a);
        paired.add(b);
      }
    }
  }

  for (const a of added) {
    if (removed.has(a)) {
      pairs.push({ source: a, target: a, type: 'inverse' });
      paired.add(a);
    }
  }

  const orphans = [...added, ...removed].filter(p => !paired.has(p));

  return { pairs, orphans };
}

export function formatDependencyReport(report: DependencyReport): string {
  const lines: string[] = ['Dependency Report', '================='];

  if (report.pairs.length === 0) {
    lines.push('No dependencies detected.');
  } else {
    for (const p of report.pairs) {
      lines.push(`  [${p.type}] ${p.source} <-> ${p.target}`);
    }
  }

  if (report.orphans.length > 0) {
    lines.push('');
    lines.push(`Orphaned fields (${report.orphans.length}):`);
    for (const o of report.orphans) {
      lines.push(`  - ${o}`);
    }
  }

  return lines.join('\n');
}
