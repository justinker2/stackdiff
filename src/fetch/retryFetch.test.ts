import { retryFetch, sleep } from "./retryFetch";

export function makeStatusError(status: number): Error & { status: number } {
  const err = new Error(`HTTP ${status}`) as Error & { status: number };
  err.status = status;
  return err;
}

describe("sleep", () => {
  it("resolves after the given delay", async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe("retryFetch", () => {
  it("returns immediately on success", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const result = await retryFetch(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable status codes", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(makeStatusError(503))
      .mockRejectedValueOnce(makeStatusError(503))
      .mockResolvedValue("recovered");

    const result = await retryFetch(fn, { baseDelayMs: 0 });
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws immediately on non-retryable status", async () => {
    const fn = jest.fn().mockRejectedValue(makeStatusError(404));
    await expect(retryFetch(fn, { baseDelayMs: 0 })).rejects.toMatchObject({ status: 404 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting retries", async () => {
    const fn = jest.fn().mockRejectedValue(makeStatusError(500));
    await expect(
      retryFetch(fn, { maxRetries: 2, baseDelayMs: 0 })
    ).rejects.toMatchObject({ status: 500 });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("respects custom retryOn list", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(makeStatusError(422))
      .mockResolvedValue("done");

    const result = await retryFetch(fn, { retryOn: [422], baseDelayMs: 0 });
    expect(result).toBe("done");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
