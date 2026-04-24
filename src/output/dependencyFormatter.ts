import type { DependencyReport, DependencyPair } from '../diff/diffDependency';

const TYPE_LABELS: Record<DependencyPair['type'], string> = {
  'added-together': '\u001b[32m+pair\u001b[0m',
  'removed-together': '\u001b[31m-pair\u001b[0m',
  'inverse': '\u001b[33m~inv\u001b[0m',
};

export function formatDependencyEntry(pair: DependencyPair): string {
  const label = TYPE_LABELS[pair.type];
  if (pair.source === pair.target) {
    return `  ${label}  ${pair.source}`;
  }
  return `  ${label}  ${pair.source}  <->  ${pair.target}`;
}

export function formatDependencyBadge(report: DependencyReport): string {
  const counts: Record<DependencyPair['type'], number> = {
    'added-together': 0,
    'removed-together': 0,
    'inverse': 0,
  };
  for (const p of report.pairs) counts[p.type]++;
  const parts: string[] = [];
  if (counts['added-together']) parts.push(`+${counts['added-together']} added-pair`);
  if (counts['removed-together']) parts.push(`-${counts['removed-together']} removed-pair`);
  if (counts['inverse']) parts.push(`~${counts['inverse']} inverse`);
  if (parts.length === 0) return 'no dependencies';
  return parts.join('  ');
}

export function formatDependencyMarkdown(report: DependencyReport): string {
  const lines: string[] = ['## Dependency Report', ''];
  if (report.pairs.length === 0) {
    lines.push('_No dependencies detected._');
  } else {
    lines.push('| Type | Source | Target |');
    lines.push('|------|--------|--------|');
    for (const p of report.pairs) {
      lines.push(`| ${p.type} | \`${p.source}\` | \`${p.target}\` |`);
    }
  }
  if (report.orphans.length > 0) {
    lines.push('');
    lines.push('### Orphaned Fields');
    for (const o of report.orphans) {
      lines.push(`- \`${o}\``);
    }
  }
  return lines.join('\n');
}
