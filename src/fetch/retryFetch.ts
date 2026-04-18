export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  retryOnStatuses?: number[];
}

const DEFAULT_RETRY_STATUSES = [429, 500, 502, 503, 504];

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isStatusError(err: unknown): err is { status: number } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as Record<string, unknown>).status === "number"
  );
}

export async function retryFetch(
  fn: () => Promise<Response>,
  options: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelayMs = 200,
    retryOnStatuses = DEFAULT_RETRY_STATUSES,
  } = options;

  let attempt = 0;

  while (true) {
    let response: Response;
    try {
      response = await fn();
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      attempt++;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
      continue;
    }

    if (!retryOnStatuses.includes(response.status) || attempt >= maxRetries) {
      return response;
    }

    attempt++;
    await sleep(baseDelayMs * 2 ** (attempt - 1));
  }
}
