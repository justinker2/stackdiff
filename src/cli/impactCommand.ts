import { assessImpact, formatImpactReport, ImpactLevel } from '../diff/diffImpact';
import { compareResponses } from '../diff/index';
import { parseArgs } from './parseArgs';

export interface ImpactArgs {
  urlA: string;
  urlB: string;
  minLevel: ImpactLevel;
  json: boolean;
}

export function parseImpactArgs(argv: string[]): ImpactArgs {
  const LEVELS: ImpactLevel[] = ['critical', 'high', 'medium', 'low', 'none'];

  let minLevel: ImpactLevel = 'low';
  let json = false;
  const filtered: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--min-level' && argv[i + 1]) {
      const val = argv[++i] as ImpactLevel;
      if (!LEVELS.includes(val)) {
        throw new Error(`Invalid --min-level value: ${val}. Must be one of ${LEVELS.join(', ')}`);
      }
      minLevel = val;
    } else if (argv[i] === '--json') {
      json = true;
    } else {
      filtered.push(argv[i]);
    }
  }

  const { urlA, urlB } = parseArgs(filtered);
  return { urlA, urlB, minLevel, json };
}

const LEVEL_ORDER: ImpactLevel[] = ['critical', 'high', 'medium', 'low', 'none'];

function meetsMinLevel(level: ImpactLevel, minLevel: ImpactLevel): boolean {
  return LEVEL_ORDER.indexOf(level) <= LEVEL_ORDER.indexOf(minLevel);
}

export async function runImpactCommand(argv: string[]): Promise<void> {
  const args = parseImpactArgs(argv);

  const diffEntries = await compareResponses(args.urlA, args.urlB);
  const report = assessImpact(diffEntries);

  const filtered = {
    ...report,
    entries: report.entries.filter(e => meetsMinLevel(e.level, args.minLevel)),
  };

  if (args.json) {
    process.stdout.write(JSON.stringify(filtered, null, 2) + '\n');
    return;
  }

  process.stdout.write(formatImpactReport(filtered) + '\n');

  const exitOnLevels: ImpactLevel[] = ['critical', 'high'];
  if (exitOnLevels.includes(report.overallLevel)) {
    process.exit(1);
  }
}
