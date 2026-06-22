import { describe, expect, test, vi } from "vitest";
import { CachingStrategy, createCachingStrategy } from "../caching-strategy";

function makeTier(name: string, readResult: unknown = null, shouldFail = false) {
  const readMock = shouldFail
    ? vi.fn().mockRejectedValue(new Error(`${name} read fail`))
    : vi.fn().mockResolvedValue(readResult);
  const writeMock = vi.fn().mockResolvedValue(undefined);
  return { name, read: readMock, write: writeMock };
}

function makeGenerator(result: string | null = null, shouldFail = false) {
  const generateMock = shouldFail
    ? vi.fn().mockRejectedValue(new Error("gen fail"))
    : vi.fn().mockResolvedValue(result);
  return { generate: generateMock };
}

describe("CachingStrategy", () => {
  test("returns first non-null cache hit", async () => {
    const tier1 = makeTier("L1", null);
    const tier2 = makeTier("L2", "cached-value");
    const gen = makeGenerator("generated");
    const strategy = new CachingStrategy([tier1, tier2], gen);

    const result = await strategy.resolve("query");

    expect(result).toBe("cached-value");
    expect(tier1.read).toHaveBeenCalledWith("query");
    expect(tier2.read).toHaveBeenCalledWith("query");
    expect(gen.generate).not.toHaveBeenCalled();
  });

  test("returns null when all tiers miss and generator returns null", async () => {
    const tier = makeTier("L1", null);
    const gen = makeGenerator(null);
    const strategy = new CachingStrategy([tier], gen);

    const result = await strategy.resolve("query");

    expect(result).toBeNull();
    expect(gen.generate).toHaveBeenCalledWith("query");
  });

  test("writes to all tiers after cache miss + generation", async () => {
    const tier1 = makeTier("L1");
    const tier2 = makeTier("L2");
    const gen = makeGenerator("new-value");
    const strategy = new CachingStrategy([tier1, tier2], gen);

    await strategy.resolve("query");

    expect(tier1.write).toHaveBeenCalledWith("query", "new-value");
    expect(tier2.write).toHaveBeenCalledWith("query", "new-value");
  });

  test("does not write when generator returns null", async () => {
    const tier = makeTier("L1");
    const gen = makeGenerator(null);
    const strategy = new CachingStrategy([tier], gen);

    await strategy.resolve("query");

    expect(tier.write).not.toHaveBeenCalled();
  });

  test("skips rejected tier and returns next valid hit", async () => {
    const tier1 = makeTier("L1", null, true);
    const tier2 = makeTier("L2", "from-l2");
    const gen = makeGenerator("gen");
    const strategy = new CachingStrategy([tier1, tier2], gen);

    const result = await strategy.resolve("query");

    expect(result).toBe("from-l2");
    expect(gen.generate).not.toHaveBeenCalled();
  });

  test("continues to generator when all tiers reject", async () => {
    const tier1 = makeTier("L1", null, true);
    const tier2 = makeTier("L2", null, true);
    const gen = makeGenerator("fallback");
    const strategy = new CachingStrategy([tier1, tier2], gen);

    const result = await strategy.resolve("query");

    expect(result).toBe("fallback");
  });

  test("handles write failure gracefully (no throw)", async () => {
    const tier = makeTier("L1");
    tier.write.mockRejectedValue(new Error("write fail"));
    const gen = makeGenerator("val");
    const strategy = new CachingStrategy([tier], gen);

    const result = await strategy.resolve("query");

    expect(result).toBe("val");
  });

  test("reads tiers in parallel via Promise.allSettled", async () => {
    const tier1 = makeTier("L1", "hit-1");
    const tier2 = makeTier("L2", "hit-2");
    const gen = makeGenerator("gen");
    const strategy = new CachingStrategy([tier1, tier2], gen);

    const result = await strategy.resolve("query");

    expect(result).toBe("hit-1");
  });

  test("treats undefined as cache miss (like null)", async () => {
    const tier = makeTier("L1", undefined);
    const gen = makeGenerator("gen-value");
    const strategy = new CachingStrategy([tier], gen);

    const result = await strategy.resolve("query");

    expect(result).toBe("gen-value");
    expect(gen.generate).toHaveBeenCalled();
  });

  test("empty tiers array falls through to generator", async () => {
    const gen = makeGenerator("generated-only");
    const strategy = new CachingStrategy([], gen);

    const result = await strategy.resolve("query");

    expect(result).toBe("generated-only");
  });
});

describe("createCachingStrategy", () => {
  test("returns a CachingStrategy instance", () => {
    const gen = makeGenerator();
    const strategy = createCachingStrategy([], gen.generate);
    expect(strategy).toBeInstanceOf(CachingStrategy);
  });

  test("works end-to-end via factory", async () => {
    const tier = makeTier("L1", null);
    const gen = makeGenerator("factory-result");
    const strategy = createCachingStrategy([tier], gen.generate);

    const result = await strategy.resolve("params");

    expect(result).toBe("factory-result");
  });
});
