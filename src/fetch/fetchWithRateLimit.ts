/**
 * Wraps fetchJson with rate limiting support.
 * Ensures requests to the same host are spaced out.
 */

import { fetchJson, FetchOptions } from './fetchResponse';
import { waitForRateLimit, RateLimitOptions } from './rateLimit';

export interface RateLimitedFetchOptions extends FetchOptions {
  rateLimit?: RateLimitOptions;
}

export async function fetchJsonWithRateLimit(
  url: string,
  options: RateLimitedFetchOptions = {}
): Promise<unknown> {
  const { rateLimit, ...fetchOptions } = options;
  await waitForRateLimit(url, rateLimit);
  return fetchJson(url, fetchOptions);
}

/**
 * Fetches two URLs with rate limiting applied per host.
 * Useful when both URLs share the same host.
 */
export async function fetchBothWithRateLimit(
  urlA: string,
  urlB: string,
  options: RateLimitedFetchOptions = {}
): Promise<[unknown, unknown]> {
  const { rateLimit, ...fetchOptions } = options;

  await waitForRateLimit(urlA, rateLimit);
  const responseA = await fetchJson(urlA, fetchOptions);

  await waitForRateLimit(urlB, rateLimit);
  const responseB = await fetchJson(urlB, fetchOptions);

  return [responseA, responseB];
}
