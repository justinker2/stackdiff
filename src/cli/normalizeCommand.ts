/**
 * normalizeCommand.ts
 * CLI handler for the `normalize` sub-command.
 * Reads a JSON diff file, normalizes its entries, and writes the result.
 */

import fs from 'fs';
import path from 'path';
import { normalizeDiff, formatNormalizeSummary, NormalizeOptions, DiffEntry } from '../diff/diffNormalize';

export interface NormalizeArgs {
  input: string;
  output?: string;
  lowercaseKeys: boolean;
  stripArrayIndices: boolean;
  trimWhitespace: boolean;
}

export function parseNormalizeArgs(argv: string[]): NormalizeArgs {
  const args: NormalizeArgs = {
    input: '',
    output: undefined,
    lowercaseKeys: true,
    stripArrayIndices: true,
    trimWhitespace: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--input' || arg === '-i') && argv[i + 1]) {
      args.input = argv[++i];
    } else if ((arg === '--output' || arg === '-o') && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg === '--no-lowercase') {
      args.lowercaseKeys = false;
    } else if (arg === '--no-strip-indices') {
      args.stripArrayIndices = false;
    } else if (arg === '--no-trim') {
      args.trimWhitespace = false;
    }
  }

  if (!args.input) throw new Error('--input <file> is required for normalize command.');
  return args;
}

export async function runNormalizeCommand(argv: string[]): Promise<void> {
  const args = parseNormalizeArgs(argv);

  const raw = fs.readFileSync(path.resolve(args.input), 'utf-8');
  const entries: DiffEntry[] = JSON.parse(raw);

  const opts: NormalizeOptions = {
    lowercaseKeys: args.lowercaseKeys,
    stripArrayIndices: args.stripArrayIndices,
    trimWhitespace: args.trimWhitespace,
  };

  const normalized = normalizeDiff(entries, opts);
  const summary = formatNormalizeSummary(entries.length, normalized.length);

  const outputPath = args.output ? path.resolve(args.output) : null;
  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2), 'utf-8');
    console.log(`Wrote ${normalized.length} entr${normalized.length === 1 ? 'y' : 'ies'} to ${outputPath}`);
  } else {
    console.log(JSON.stringify(normalized, null, 2));
  }

  console.log(summary);
}
