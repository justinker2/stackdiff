import { compareResponses } from '../diff';
import { scoreDiff, formatScore } from '../diff/diffScore';
import { fetchJson } from '../fetch/fetchResponse';
import { parseArgs } from './parseArgs';

export interface ScoreArgs {
  urlA: string;
  urlB: string;
  json: boolean;
}

export function parseScoreArgs(argv: string[]): ScoreArgs {
  const base = parseArgs(argv);
  const json = argv.includes('--json');
  return { urlA: base.urlA, urlB: base.urlB, json };
}

export async function runScoreCommand(argv: string[]): Promise<void> {
  const args = parseScoreArgs(argv);

  let dataA: unknown;
  let dataB: unknown;

  try {
    dataA = await fetchJson(args.urlA);
  } catch (err) {
    console.error(`Failed to fetch ${args.urlA}: ${(err as Error).message}`);
    process.exit(1);
  }

  try {
    dataB = await fetchJson(args.urlB);
  } catch (err) {
    console.error(`Failed to fetch ${args.urlB}: ${(err as Error).message}`);
    process.exit(1);
  }

  const entries = compareResponses(dataA, dataB);
  const result = scoreDiff(entries);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatScore(result));
  }
}
