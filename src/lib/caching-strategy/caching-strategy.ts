export interface CacheReadAdapter<T, P> {
  read(params: P): Promise<T | null>;
}

export interface CacheWriteAdapter<T, P> {
  write(params: P, value: T): Promise<void>;
}

export interface CacheTier<T, P> extends CacheReadAdapter<T, P>, CacheWriteAdapter<T, P> {
  name: string;
}

export interface Generator<T, P> {
  generate(params: P): Promise<T | null>;
}

/**
 * CacheResolver is the injectable seam for the CachingStrategy.
 * It wraps the full resolve(generate) flow so consumers can swap
 * caching behaviour without knowing about tiers.
 */
export interface CacheResolver<T, P> {
  resolve(params: P): Promise<T | null>;
}

export class CachingStrategy<T, P> implements CacheResolver<T, P> {
  constructor(
    private tiers: CacheTier<T, P>[],
    private generator: Generator<T, P>,
  ) {}

  async resolve(params: P): Promise<T | null> {
    for (const tier of this.tiers) {
      try {
        const value = await tier.read(params);
        if (value !== null && value !== undefined) {
          return value;
        }
      } catch (e) {
        console.warn(`Cache read from tier ${tier.name} failed:`, e);
      }
    }

    const generated = await this.generator.generate(params);
    if (generated !== null && generated !== undefined) {
      await Promise.allSettled(
        this.tiers.map((t) =>
          t
            .write(params, generated)
            .catch((e) => console.warn(`Cache write to ${t.name} failed:`, e)),
        ),
      );
    }

    return generated;
  }
}

export function createCachingStrategy<T, P>(
  tiers: CacheTier<T, P>[],
  generate: (params: P) => Promise<T | null>,
): CachingStrategy<T, P> {
  return new CachingStrategy(tiers, { generate });
}
