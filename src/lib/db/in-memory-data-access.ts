import type {
	Collection,
	DataAccess,
	DataAccessTable,
	WhereClause,
} from "@/lib/db/data-access";

// ──────────────────────────────────────────────
// Lazy-evaluated collection
// ──────────────────────────────────────────────

class InMemoryCollection<T> implements Collection<T> {
	constructor(
		private readonly getItems: () => T[],
		private readonly compareFn?: (a: T, b: T) => number,
	) {}

	async first(): Promise<T | undefined> {
		return this.getItems()[0];
	}

	async toArray(): Promise<T[]> {
		const items = this.getItems();
		return this.compareFn ? [...items].sort(this.compareFn) : [...items];
	}

	async count(): Promise<number> {
		return this.getItems().length;
	}

	async delete(): Promise<void> {
		throw new Error("InMemory delete() not implemented — use table.delete()");
	}

	async modify(_changes: Partial<T> | ((record: T) => void)): Promise<number> {
		throw new Error("InMemory modify() not implemented — use table.update()");
	}

	reverse(): Collection<T> {
		return new InMemoryCollection(
			() => this.getItems(),
			(a, b) => -1 * (this.compareFn?.(a, b) ?? 0),
		);
	}

	limit(n: number): Collection<T> {
		return new InMemoryCollection(() => this.getItems().slice(0, n));
	}

	filter(pred: (item: T) => boolean): Collection<T> {
		return new InMemoryCollection(() => this.getItems().filter(pred));
	}

	async sortBy(index: string): Promise<T[]> {
		return [...this.getItems()].sort((a, b) => {
			const av = (a as Record<string, unknown>)[index] as string | number;
			const bv = (b as Record<string, unknown>)[index] as string | number;
			if (av < bv) return -1;
			if (av > bv) return 1;
			return 0;
		});
	}
}

class InMemoryWhereClause<T> implements WhereClause<T> {
	constructor(
		private readonly getItems: () => T[],
		private readonly index: string,
	) {}

	private filterBy(pred: (val: unknown) => boolean): InMemoryCollection<T> {
		return new InMemoryCollection(() =>
			this.getItems().filter((item) =>
				pred((item as Record<string, unknown>)[this.index]),
			),
		);
	}

	equals(val: unknown): Collection<T> {
		return this.filterBy((v) => v === val);
	}

	belowOrEqual(val: unknown): Collection<T> {
		return this.filterBy(
			(v) => typeof v === "number" && typeof val === "number" && v <= val,
		);
	}

	below(val: unknown): Collection<T> {
		return this.filterBy(
			(v) => typeof v === "number" && typeof val === "number" && v < val,
		);
	}

	startsWith(val: string): Collection<T> {
		return this.filterBy((v) => typeof v === "string" && v.startsWith(val));
	}

	anyOf(vals: unknown[]): Collection<T> {
		const set = new Set(vals);
		return this.filterBy((v) => set.has(v));
	}
}

// ──────────────────────────────────────────────
// In-memory table
// ──────────────────────────────────────────────

type IdType = string | number;

export class InMemoryTable<
	T extends Record<string, unknown>,
	TId extends IdType = number,
> implements DataAccessTable<T, TId>
{
	private items = new Map<TId, T>();
	private nextId = 1;

	seed(data: T[]): void {
		for (const item of data) {
			if (item.id != null) {
				this.items.set(item.id as TId, item);
			} else {
				const autoId = this.nextId++ as TId;
				this.items.set(autoId, { ...item, id: autoId } as T);
			}
		}
	}

	async get(id: TId): Promise<T | undefined> {
		return this.items.get(id);
	}

	async add(item: Omit<T, "id">): Promise<TId> {
		const id = this.nextId++ as TId;
		this.items.set(id, { ...item, id } as unknown as T);
		return id;
	}

	async put(item: T): Promise<TId> {
		const id = (item.id ?? this.nextId++) as TId;
		this.items.set(id, { ...item, id } as unknown as T);
		return id;
	}

	async update(id: TId, changes: Partial<T>): Promise<TId> {
		const existing = this.items.get(id);
		if (existing) {
			this.items.set(id, { ...existing, ...changes } as T);
		}
		return id;
	}

	async delete(id: TId): Promise<void> {
		this.items.delete(id);
	}

	async bulkAdd(items: Omit<T, "id">[]): Promise<TId[]> {
		const ids: TId[] = [];
		for (const item of items) {
			ids.push(await this.add(item));
		}
		return ids;
	}

	async bulkDelete(ids: TId[]): Promise<void> {
		for (const id of ids) {
			this.items.delete(id);
		}
	}

	async toArray(): Promise<T[]> {
		return [...this.items.values()];
	}

	async count(): Promise<number> {
		return this.items.size;
	}

	async clear(): Promise<void> {
		this.items.clear();
	}

	limit(n: number): Collection<T> {
		return new InMemoryCollection(() => [...this.items.values()].slice(0, n));
	}

	where(index: string): WhereClause<T> {
		return new InMemoryWhereClause(() => [...this.items.values()], index);
	}

	orderBy(index: string): Collection<T> {
		return new InMemoryCollection(
			() => [...this.items.values()],
			(a: T, b: T) => {
				const av = a[index] as string | number;
				const bv = b[index] as string | number;
				if (av < bv) return -1;
				if (av > bv) return 1;
				return 0;
			},
		);
	}
}

// ──────────────────────────────────────────────
// InMemoryDataAccess
// ──────────────────────────────────────────────

export class InMemoryDataAccess implements DataAccess {
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	flashcards = new InMemoryTable<any, string>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	reviewHistory = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	analyticsEvents = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	retentionRecurrence = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	wrongAnswers = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	quizPacks = new InMemoryTable<any, string>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	packQuestions = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	competencies = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	progress = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	quizAttempts = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	bookmarks = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	questions = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	subjects = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	visuals = new InMemoryTable<any>();
	// Phase 3 — expanded tables
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	chatMessages = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	questionRatings = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	knowledgeGraph = new InMemoryTable<any, string>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	examSessions = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	sharedQuestions = new InMemoryTable<any, string>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	examDates = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	notes = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	gamification = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	cachedPdfs = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	quizSessions = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	tinyfishCache = new InMemoryTable<any, string>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	tinyfishUsage = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	jobs = new InMemoryTable<any>();
	// biome-ignore lint/suspicious/noExplicitAny: must match DataAccess interface
	conflicts = new InMemoryTable<any>();
}
