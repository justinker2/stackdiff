export { extractShape, diffShapes } from './shapeDiff';
export type { ShapeNode, DiffEntry } from './shapeDiff';
export { formatDiff } from './formatDiff';

import { extractShape, diffShapes } from './shapeDiff';
import { formatDiff } from './formatDiff';

export interface CompareOptions {
  /** Disable ANSI color codes in output */
  noColor?: boolean;
}

/**
 * Compare two API response payloads and return a formatted diff string.
 */
export function compareResponses(
  left: unknown,
  right: unknown,
  options: CompareOptions = {}
): { entries: ReturnType<typeof diffShapes>; output: string } {
  const leftShape = extractShape(left);
  const rightShape = extractShape(right);
  const entries = diffShapes(leftShape, rightShape);
  const output = formatDiff(entries, !options.noColor);
  return { entries, output };
}
