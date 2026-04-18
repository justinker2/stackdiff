export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  retryOn?: number[];
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isStatusError(err: unknown): err is { status: number } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as Record<string, unknown>).status === "number"
  );
}

export async function retryFetch<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 200, retryOn = [429, 500, 502, 503, 504] } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const shouldRetry =
        attempt < maxRetries &&
        isStatusError(err) &&
        retryOn.includes(err.status);

      if (!shouldRetry) {
        throw err;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}
