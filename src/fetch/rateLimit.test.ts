import { getHostname, waitForRateLimit, resetRateLimitState } from './rateLimit';

beforeEach(() => {
  resetRateLimitState();
});

describe('getHostname', () => {
  it('extracts hostname from a valid URL', () => {
    expect(getHostname('https://api.example.com/v1/data')).toBe('api.example.com');
  });

  it('returns the raw string if URL is invalid', () => {
    expect(getHostname('not-a-url')).toBe('not-a-url');
  });
});

describe('waitForRateLimit', () => {
  it('does not delay on first request to a host', async () => {
    const start = Date.now();
    await waitForRateLimit('https://api.example.com/data', { minDelayMs: 200 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('enforces minimum delay between requests to the same host', async () => {
    await waitForRateLimit('https://api.example.com/a', { minDelayMs: 200 });
    const start = Date.now();
    await waitForRateLimit('https://api.example.com/b', { minDelayMs: 200 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(150);
  });

  it('does not delay for different hosts', async () => {
    await waitForRateLimit('https://api.example.com/a', { minDelayMs: 300 });
    const start = Date.now();
    await waitForRateLimit('https://other.example.com/b', { minDelayMs: 300 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('uses default delay when no options provided', async () => {
    await waitForRateLimit('https://api.example.com/a');
    const start = Date.now();
    await waitForRateLimit('https://api.example.com/b');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(400);
  }, 10000);
});
