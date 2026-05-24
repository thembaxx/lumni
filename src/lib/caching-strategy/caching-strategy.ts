export interface CacheReadAdapter<T, P> {
	read(params: P): Promise<T | null>;
}

export interface CacheWriteAdapter<T, P> {
	write(params: P, value: T): Promise<void>;
}

export interface CacheTier<T, P>
	extends CacheReadAdapter<T, P>,
		CacheWriteAdapter<T, P> {
	name: string;
}

export interface Generator<T, P> {
	generate(params: P): Promise<T | null>;
}

export class CachingStrategy<T, P> {
	constructor(
		private tiers: CacheTier<T, P>[],
		private generator: Generator<T, P>,
	) {}

	async resolve(params: P): Promise<T | null> {
		const cachedItems = await Promise.all(
			this.tiers.map((tier) => tier.read(params)),
		);
		for (const cached of cachedItems) {
			if (cached !== null && cached !== undefined) return cached;
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
