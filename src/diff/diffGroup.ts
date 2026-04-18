import { DiffEntry } from "./diffFilter";

export type GroupKey = "path" | "changeType" | "severity";

export interface GroupedDiff {
  key: string;
  entries: DiffEntry[];
}

export function groupBy(entries: DiffEntry[], key: GroupKey): GroupedDiff[] {
  const map = new Map<string, DiffEntry[]>();

  for (const entry of entries) {
    const groupKey = resolveKey(entry, key);
    if (!map.has(groupKey)) map.set(groupKey, []);
    map.get(groupKey)!.push(entry);
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => ({ key: k, entries: v }));
}

function resolveKey(entry: DiffEntry, key: GroupKey): string {
  switch (key) {
    case "path":
      return entry.path.split(".")[0] ?? entry.path;
    case "changeType":
      return entry.change;
    case "severity":
      return (entry as any).severity ?? "unknown";
    default:
      return "unknown";
  }
}

export function formatGroupReport(groups: GroupedDiff[]): string {
  const lines: string[] = [];
  for (const group of groups) {
    lines.push(`[${group.key}] (${group.entries.length} change${group.entries.length !== 1 ? "s" : ""})`);
    for (const e of group.entries) {
      const detail = e.change === "changed"
        ? `${e.path}: ${e.from} → ${e.to}`
        : `${e.path} (${e.change})`;
      lines.push(`  ${detail}`);
    }
  }
  return lines.join("\n");
}
