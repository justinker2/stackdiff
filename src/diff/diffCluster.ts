import type { DiffEntry } from './diffFilter';

export interface ClusterOptions {
  prefixDepth?: number; // how many path segments to use as cluster key
  minSize?: number;     // minimum entries to form a cluster
}

export interface Cluster {
  key: string;
  entries: DiffEntry[];
  changeTypes: Record<string, number>;
}

export function resolveClusterKey(path: string, depth: number): string {
  const segments = path.split('.');
  return segments.slice(0, depth).join('.') || '(root)';
}

export function clusterDiff(
  entries: DiffEntry[],
  options: ClusterOptions = {}
): Cluster[] {
  const { prefixDepth = 2, minSize = 1 } = options;
  const map = new Map<string, DiffEntry[]>();

  for (const entry of entries) {
    const key = resolveClusterKey(entry.path, prefixDepth);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }

  const clusters: Cluster[] = [];
  for (const [key, clusterEntries] of map.entries()) {
    if (clusterEntries.length < minSize) continue;
    const changeTypes: Record<string, number> = {};
    for (const e of clusterEntries) {
      changeTypes[e.change] = (changeTypes[e.change] ?? 0) + 1;
    }
    clusters.push({ key, entries: clusterEntries, changeTypes });
  }

  return clusters.sort((a, b) => b.entries.length - a.entries.length);
}

export function formatClusterReport(clusters: Cluster[]): string {
  if (clusters.length === 0) return 'No clusters found.';

  const lines: string[] = [`Clusters (${clusters.length}):\n`];
  for (const cluster of clusters) {
    const summary = Object.entries(cluster.changeTypes)
      .map(([type, count]) => `${type}:${count}`)
      .join(', ');
    lines.push(`  ${cluster.key}  [${cluster.entries.length} entries]  ${summary}`);
    for (const entry of cluster.entries) {
      lines.push(`    - ${entry.path}  (${entry.change})`);
    }
  }
  return lines.join('\n');
}
