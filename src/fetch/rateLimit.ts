/**
 * Rate limiting utilities for fetch requests.
 * Enforces a minimum delay between requests to the same host.
 */

const lastRequestTime: Map<string, number> = new Map();

export interface RateLimitOptions {
  minDelayMs?: number;
}

const DEFAULT_MIN_DELAY_MS = 500;

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export async function waitForRateLimit(
  url: string,
  options: RateLimitOptions = {}
): Promise<void> {
  const minDelay = options.minDelayMs ?? DEFAULT_MIN_DELAY_MS;
  const hostname = getHostname(url);
  const now = Date.now();
  const last = lastRequestTime.get(hostname);

  if (last !== undefined) {
    const elapsed = now - last;
    if (elapsed < minDelay) {
      const wait = minDelay - elapsed;
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  lastRequestTime.set(hostname, Date.now());
}

export function resetRateLimitState(): void {
  lastRequestTime.clear();
}
