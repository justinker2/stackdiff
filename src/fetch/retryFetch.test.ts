import { retryFetch, sleep, isStatusError } from "./retryFetch";

export function makeStatusError(status: number): { status: number } {
  return { status };
}

describe("sleep", () => {
  it("resolves after roughly the given delay", async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe("isStatusError", () => {
  it("returns true for objects with numeric status", () => {
    expect(isStatusError(makeStatusError(500))).toBe(true);
  });

  it("returns false for non-objects", () => {
    expect(isStatusError(null)).toBe(false);
    expect(isStatusError("error")).toBe(false);
  });

  it("returns false for objects without status", () => {
    expect(isStatusError({ message: "oops" })).toBe(false);
  });
});

describe("retryFetch", () => {
  it("returns immediately on a successful response", async () => {
    const fn = jest.fn().mockResolvedValue({ status: 200 } as Response);
    const result = await retryFetch(fn, { maxRetries: 3, baseDelayMs: 0 });
    expect(result.status).toBe(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on a retryable status code", async () => {
    const fn = jest
      .fn()
      .mockResolvedValueOnce({ status: 503 } as Response)
      .mockResolvedValueOnce({ status: 503 } as Response)
      .mockResolvedValueOnce({ status: 200 } as Response);

    const result = await retryFetch(fn, { maxRetries: 3, baseDelayMs: 0 });
    expect(result.status).toBe(200);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("returns last retryable response when maxRetries exhausted", async () => {
    const fn = jest.fn().mockResolvedValue({ status: 429 } as Response);
    const result = await retryFetch(fn, { maxRetries: 2, baseDelayMs: 0 });
    expect(result.status).toBe(429);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("retries on thrown errors and eventually throws", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("network failure"));
    await expect(
      retryFetch(fn, { maxRetries: 2, baseDelayMs: 0 })
    ).rejects.toThrow("network failure");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
