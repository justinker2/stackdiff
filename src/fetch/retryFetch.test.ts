import { fetchWithRetry } from './retryFetch';
import * as fetchModule from './fetchResponse';

jest.mock('./fetchResponse');

const mockFetchJson = fetchModule.fetchJson as jest.MockedFunction<typeof fetchModule.fetchJson>;

function makeStatusError(status: number): Error & { statusCode: number } {
  const err = new Error(`HTTP ${status}`) as Error & { statusCode: number };
  err.statusCode = status;
  return err;
}

describe('fetchWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns data on first successful attempt', async () => {
    mockFetchJson.mockResolvedValueOnce({ ok: true });
    const result = await fetchWithRetry('https://example.com/api');
    expect(result).toEqual({ ok: true });
    expect(mockFetchJson).toHaveBeenCalledTimes(1);
  });

  it('retries on 500 and succeeds', async () => {
    mockFetchJson
      .mockRejectedValueOnce(makeStatusError(500))
      .mockResolvedValueOnce({ recovered: true });

    const promise = fetchWithRetry('https://example.com/api', {}, { delayMs: 10 });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ recovered: true });
    expect(mockFetchJson).toHaveBeenCalledTimes(2);
  });

  it('throws immediately on non-retryable status code', async () => {
    mockFetchJson.mockRejectedValueOnce(makeStatusError(404));

    await expect(
      fetchWithRetry('https://example.com/api', {}, { retryOn: [500] })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockFetchJson).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting all retries', async () => {
    mockFetchJson.mockRejectedValue(makeStatusError(503));

    const promise = fetchWithRetry('https://example.com/api', {}, { maxRetries: 2, delayMs: 10 });
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toMatchObject({ statusCode: 503 });
    expect(mockFetchJson).toHaveBeenCalledTimes(3);
  });
});
