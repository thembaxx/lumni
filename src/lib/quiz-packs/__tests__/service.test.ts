import { beforeEach, describe, expect, test } from "bun:test";
import type { Collection, DataAccess } from "@/lib/db/data-access";
import { InMemoryDataAccess } from "@/lib/db/in-memory-data-access";
import { QuizPackService } from "../service";
import type { QuizPack, QuizPackQuestion } from "../types";
import { PACK_EXPIRY_DAYS } from "../types";

class PatchedCollection<T> implements Collection<T> {
	private inner: Collection<T>;
	private onDelete: () => Promise<void>;

	constructor(inner: Collection<T>, onDelete: () => Promise<void>) {
		this.inner = inner;
		this.onDelete = onDelete;
	}

	async toArray(): Promise<T[]> {
		return this.inner.toArray();
	}
	async first(): Promise<T | undefined> {
		return this.inner.first();
	}
	async count(): Promise<number> {
		return this.inner.count();
	}
	async delete(): Promise<void> {
		await this.onDelete();
	}
	async modify(changes: Partial<T> | ((record: T) => void)): Promise<number> {
		return this.inner.modify(changes);
	}
	reverse(): Collection<T> {
		return this.inner.reverse();
	}
	limit(n: number): Collection<T> {
		return this.inner.limit(n);
	}
	filter(pred: (item: T) => boolean): Collection<T> {
		return this.inner.filter(pred);
	}
	sortBy(index: string): Promise<T[]> {
		return this.inner.sortBy(index);
	}
}

describe("QuizPackService", () => {
	let db: DataAccess;
	let service: QuizPackService;

	function seedPack(overrides: Partial<QuizPack> & { id: string }): QuizPack {
		return {
			subject: "Mathematics",
			topic: null,
			title: "Mathematics Pack",
			questionCount: 5,
			status: "generating",
			downloadProgress: 0,
			storageBytes: 0,
			createdAt: Date.now(),
			expiresAt: Date.now() + PACK_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
			lastUsedAt: null,
			...overrides,
		};
	}

	beforeEach(() => {
		const rawDb = new InMemoryDataAccess();

		// InMemoryCollection.delete() throws, but deletePack and cleanupExpired
		// call packQuestions.where("packId").equals(id).delete()
		const origWhere = (
			rawDb.packQuestions as unknown as {
				where: (index: string) => ReturnType<typeof rawDb.packQuestions.where>;
			}
		).where.bind(rawDb.packQuestions);
		(
			rawDb.packQuestions as unknown as { where: (index: string) => unknown }
		).where = (index: string) => {
			const clause = origWhere(index);
			return {
				...clause,
				equals: (val: unknown) => {
					const coll = clause.equals(val);
					return new PatchedCollection(coll, async () => {
						const items = await coll.toArray();
						for (const item of items) {
							await rawDb.packQuestions.delete(
								(item as unknown as { id: number }).id,
							);
						}
					});
				},
			};
		};

		db = rawDb as unknown as DataAccess;
		service = new QuizPackService({ db });
	});

	describe("generatePack", () => {
		test("creates a pack with correct fields", async () => {
			const pack = await service.generatePack("Mathematics", "Algebra", 10);

			expect(pack.subject).toBe("Mathematics");
			expect(pack.topic).toBe("Algebra");
			expect(pack.questionCount).toBe(10);
			expect(pack.status).toBe("generating");
			expect(pack.downloadProgress).toBe(0);
			expect(pack.storageBytes).toBe(0);
			expect(pack.lastUsedAt).toBeNull();
			expect(pack.id).toStartWith("pack_");
			expect(pack.title).toBe("Mathematics - Algebra Pack");
			expect(pack.expiresAt).toBe(
				pack.createdAt + PACK_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
			);

			const all = await db.quizPacks.toArray();
			expect(all).toHaveLength(1);
		});

		test("generates a pack without a topic", async () => {
			const pack = await service.generatePack("Physical Sciences", null, 5);

			expect(pack.title).toBe("Physical Sciences Pack");
			expect(pack.topic).toBeNull();
			expect(pack.questionCount).toBe(5);
		});
	});

	describe("getPack", () => {
		test("returns undefined for non-existent pack", async () => {
			const pack = await service.getPack("nonexistent");
			expect(pack).toBeUndefined();
		});

		test("returns a pack by id", async () => {
			db.quizPacks.seed([seedPack({ id: "pack_1" })]);

			const pack = await service.getPack("pack_1");
			expect(pack).toBeDefined();
			expect(pack!.id).toBe("pack_1");
			expect(pack!.subject).toBe("Mathematics");
		});
	});

	describe("getPacks", () => {
		test("returns empty array when no packs exist", async () => {
			const packs = await service.getPacks();
			expect(packs).toEqual([]);
		});

		test("returns all packs sorted by createdAt descending", async () => {
			db.quizPacks.seed([
				seedPack({ id: "pack_old", createdAt: 1000 }),
				seedPack({ id: "pack_new", createdAt: 2000 }),
			]);

			const packs = await service.getPacks();
			expect(packs).toHaveLength(2);
			expect(packs[0].id).toBe("pack_new");
			expect(packs[1].id).toBe("pack_old");
		});

		test("transitions expired ready packs to expired status in-memory", async () => {
			const farFuture = Date.now() + 86_400_000 * 365;
			db.quizPacks.seed([
				seedPack({
					id: "pack_exp",
					status: "ready",
					expiresAt: Date.now() - 1000,
				}),
				seedPack({
					id: "pack_fresh",
					status: "ready",
					expiresAt: farFuture,
				}),
			]);

			const packs = await service.getPacks();
			expect(packs.find((p) => p.id === "pack_exp")?.status).toBe("expired");
			expect(packs.find((p) => p.id === "pack_fresh")?.status).toBe("ready");
		});
	});

	describe("markReady", () => {
		test("updates status, progress, and storageBytes", async () => {
			db.quizPacks.seed([seedPack({ id: "pack_1" })]);

			await service.markReady("pack_1", 2048);

			const pack = await service.getPack("pack_1");
			expect(pack?.status).toBe("ready");
			expect(pack?.downloadProgress).toBe(100);
			expect(pack?.storageBytes).toBe(2048);
		});
	});

	describe("markFailed", () => {
		test("updates status to failed", async () => {
			db.quizPacks.seed([seedPack({ id: "pack_1" })]);

			await service.markFailed("pack_1");

			const pack = await service.getPack("pack_1");
			expect(pack?.status).toBe("failed");
		});
	});

	describe("updateProgress", () => {
		test("updates download progress incrementally", async () => {
			db.quizPacks.seed([seedPack({ id: "pack_1" })]);

			await service.updateProgress("pack_1", 30);
			expect((await service.getPack("pack_1"))?.downloadProgress).toBe(30);

			await service.updateProgress("pack_1", 80);
			expect((await service.getPack("pack_1"))?.downloadProgress).toBe(80);
		});

		test("clamps progress to 100", async () => {
			db.quizPacks.seed([seedPack({ id: "pack_1" })]);

			await service.updateProgress("pack_1", 999);
			expect((await service.getPack("pack_1"))?.downloadProgress).toBe(100);
		});
	});

	describe("deletePack", () => {
		test("removes a pack and its questions", async () => {
			db.quizPacks.seed([seedPack({ id: "pack_1" })]);
			await db.packQuestions.bulkAdd([
				{
					packId: "pack_1",
					questionIndex: 0,
					questionText: "Q1",
					options: null,
					correctAnswer: "A",
					explanation: null,
					difficulty: "Easy",
					type: "short-answer",
				},
			]);

			await service.deletePack("pack_1");

			expect(await service.getPack("pack_1")).toBeUndefined();
			expect(await db.packQuestions.toArray()).toHaveLength(0);
		});
	});

	describe("touchPack", () => {
		test("updates lastUsedAt to current time", async () => {
			db.quizPacks.seed([seedPack({ id: "pack_1", lastUsedAt: null })]);

			await service.touchPack("pack_1");

			const pack = await service.getPack("pack_1");
			expect(pack?.lastUsedAt).toBeGreaterThan(0);
		});
	});

	describe("getStorageUsage", () => {
		test("returns zero when no packs exist", async () => {
			const usage = await service.getStorageUsage();
			expect(usage.usedBytes).toBe(0);
			expect(usage.packCount).toBe(0);
		});

		test("calculates total storage bytes and pack count", async () => {
			db.quizPacks.seed([
				seedPack({ id: "pack_1", storageBytes: 1000 }),
				seedPack({ id: "pack_2", storageBytes: 2500 }),
			]);

			const usage = await service.getStorageUsage();
			expect(usage.usedBytes).toBe(3500);
			expect(usage.packCount).toBe(2);
		});
	});

	describe("storeQuestions", () => {
		test("stores questions linked to the given pack", async () => {
			const questions = [
				{
					questionIndex: 0,
					questionText: "What is 2+2?",
					options: null,
					correctAnswer: "4",
					explanation: "Basic addition",
					difficulty: "Easy",
					type: "short-answer",
				},
				{
					questionIndex: 1,
					questionText: "What is a prime number?",
					options: null,
					correctAnswer: "2",
					explanation: null,
					difficulty: "Medium",
					type: "short-answer",
				},
			];

			await service.storeQuestions("pack_1", questions);

			const all = await db.packQuestions.toArray();
			expect(all).toHaveLength(2);
			expect(all[0].packId).toBe("pack_1");
			expect(all[1].packId).toBe("pack_1");
		});
	});

	describe("getQuestions", () => {
		test("returns questions sorted by questionIndex", async () => {
			await db.packQuestions.bulkAdd([
				{
					packId: "pack_1",
					questionIndex: 2,
					questionText: "Q2",
					options: null,
					correctAnswer: "B",
					explanation: null,
					difficulty: "Medium",
					type: "short-answer",
				},
				{
					packId: "pack_1",
					questionIndex: 0,
					questionText: "Q0",
					options: null,
					correctAnswer: "A",
					explanation: null,
					difficulty: "Easy",
					type: "short-answer",
				},
				{
					packId: "pack_1",
					questionIndex: 1,
					questionText: "Q1",
					options: null,
					correctAnswer: "C",
					explanation: null,
					difficulty: "Hard",
					type: "short-answer",
				},
			]);

			const questions = await service.getQuestions("pack_1");
			expect(questions).toHaveLength(3);
			expect(questions[0].questionIndex).toBe(0);
			expect(questions[1].questionIndex).toBe(1);
			expect(questions[2].questionIndex).toBe(2);
		});

		test("returns empty array for pack with no questions", async () => {
			const questions = await service.getQuestions("nonexistent");
			expect(questions).toEqual([]);
		});
	});

	describe("cleanupExpired", () => {
		test("removes expired packs and leaves valid packs", async () => {
			const farFuture = Date.now() + 86_400_000 * 365;
			db.quizPacks.seed([
				seedPack({
					id: "pack_expired",
					status: "ready",
					expiresAt: Date.now() - 1000,
				}),
				seedPack({
					id: "pack_valid",
					status: "ready",
					expiresAt: farFuture,
				}),
			]);

			const count = await service.cleanupExpired();

			expect(count).toBe(1);
			const remaining = await db.quizPacks.toArray();
			expect(remaining).toHaveLength(1);
			expect(remaining[0].id).toBe("pack_valid");
		});

		test("returns 0 when no packs are expired", async () => {
			db.quizPacks.seed([
				seedPack({
					id: "pack_1",
					status: "ready",
					expiresAt: Date.now() + 86_400_000,
				}),
			]);

			const count = await service.cleanupExpired();
			expect(count).toBe(0);
		});

		test("removes expired packs regardless of status", async () => {
			db.quizPacks.seed([
				seedPack({
					id: "pack_gen",
					status: "generating",
					expiresAt: Date.now() - 1000,
				}),
				seedPack({
					id: "pack_fail",
					status: "failed",
					expiresAt: Date.now() - 1000,
				}),
			]);

			const count = await service.cleanupExpired();
			expect(count).toBe(2);
			expect(await db.quizPacks.toArray()).toHaveLength(0);
		});
	});
});
