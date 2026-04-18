import { fetchJson, FetchOptions } from './fetchResponse';

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  retryOn?: number[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 300,
  retryOn: [429, 500, 502, 503, 504],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  fetchOptions: FetchOptions = {},
  retryOptions: RetryOptions = {}
): Promise<unknown> {
  const { maxRetries, delayMs, retryOn } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...retryOptions,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchJson(url, fetchOptions);
    } catch (err: unknown) {
      const error = err as Error & { statusCode?: number };
      const statusCode = error.statusCode;

      if (statusCode !== undefined && !retryOn.includes(statusCode)) {
        throw error;
      }

      lastError = error;

      if (attempt < maxRetries) {
        const backoff = delayMs * Math.pow(2, attempt);
        await sleep(backoff);
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}
