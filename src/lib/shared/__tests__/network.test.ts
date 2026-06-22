import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

let setTimeoutCalls: Array<{ fn: (...args: unknown[]) => void }>;
let callCount = 0;

beforeAll(() => {
  setTimeoutCalls = [];
  globalThis.setTimeout = ((fn: (...args: unknown[]) => void) => {
    callCount++;
    setTimeoutCalls.push({ fn });
    fn();
    return 0;
  }) as typeof globalThis.setTimeout;

  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: true },
    writable: true,
    configurable: true,
  });
});

beforeEach(() => {
  setTimeoutCalls = [];
  callCount = 0;
});

const { withRetry, isOnline } = await import("../network");

describe("withRetry", () => {
  test("resolves with value on first success", async () => {
    const result = await withRetry(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
    expect(callCount).toBe(0);
  });

  test("retries and eventually succeeds", async () => {
    let attempts = 0;
    const result = await withRetry(() => {
      attempts++;
      if (attempts < 3) return Promise.reject(new Error("fail"));
      return Promise.resolve("recovered");
    });
    expect(result).toBe("recovered");
    expect(attempts).toBe(3);
  });

  test("throws after exhausting maxRetries", async () => {
    const fn = vi.fn(() => Promise.reject(new Error("persistent")));
    await expect(withRetry(fn, { maxRetries: 2 })).rejects.toThrow("persistent");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test("uses custom maxRetries", async () => {
    const fn = vi.fn(() => Promise.reject(new Error("fail")));
    await expect(withRetry(fn, { maxRetries: 0 })).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("calls onRetry callback with attempt number", async () => {
    const onRetry = vi.fn(() => {});
    let attempts = 0;
    await withRetry(
      () => {
        attempts++;
        return attempts < 2 ? Promise.reject(new Error("fail")) : Promise.resolve("ok");
      },
      { onRetry },
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(0, expect.any(Error));
  });

  test("wraps non-Error thrown values in Error", async () => {
    const fn = vi.fn(() => Promise.reject("string error"));
    await expect(withRetry(fn, { maxRetries: 0 })).rejects.toThrow("string error");
  });
});

describe("isOnline", () => {
  test("returns navigator.onLine value", () => {
    expect(isOnline()).toBe(true);
  });
});
