import { fetchJson, FetchOptions, FetchResult } from './fetchResponse';

export interface EndpointPair {
  baseUrl: string;
  compareUrl: string;
  options?: FetchOptions;
}

export interface FetchPairResult {
  base: FetchResult;
  compare: FetchResult;
}

/**
 * Fetches the same logical endpoint from two different origins in parallel.
 * Throws if either request fails.
 */
export async function fetchPair(pair: EndpointPair): Promise<FetchPairResult> {
  const [base, compare] = await Promise.all([
    fetchJson(pair.baseUrl, pair.options),
    fetchJson(pair.compareUrl, pair.options),
  ]);
  return { base, compare };
}

export { fetchJson, FetchOptions, FetchResult };
