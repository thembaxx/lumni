import { describe, expect, test, mock, beforeEach } from "bun:test";

const mockStorage = new Map<string, unknown>();

mock.module("@/lib/utils/storage", () => ({
	loadFromStorage: (key: string, defaultValue: unknown) => {
		return mockStorage.has(key) ? mockStorage.get(key) : defaultValue;
	},
	saveToStorage: (key: string, value: unknown) => {
		mockStorage.set(key, value);
	},
}));

const { getWeeklyLeaderboard, saveWeeklySnapshot } = await import(
	"../leaderboard-service"
);

describe("leaderboard-service", () => {
	beforeEach(() => {
		mockStorage.clear();
		mockStorage.set("lumni_total_xp", 100);
		mockStorage.set("lumni_streak", 5);
	});

	test("getWeeklyLeaderboard returns user entry at top", () => {
		const entries = getWeeklyLeaderboard();
		expect(entries.length).toBeGreaterThanOrEqual(1);
		expect(entries[0].label).toBe("This Week (You)");
		expect(entries[0].xp).toBe(100);
		expect(entries[0].streak).toBe(5);
		expect(entries[0].isCurrentUser).toBe(true);
	});

	test("getWeeklyLeaderboard with no history returns only self", () => {
		const entries = getWeeklyLeaderboard();
		expect(entries).toHaveLength(1);
	});

	test("saveWeeklySnapshot stores data", () => {
		saveWeeklySnapshot("Student A", 200, 10);
		const entries = getWeeklyLeaderboard();
		expect(entries.length).toBeGreaterThanOrEqual(2);
		const studentA = entries.find((e) => e.label === "Student A");
		expect(studentA).toBeDefined();
		expect(studentA!.xp).toBe(200);
	});

	test("entries sorted by XP descending", () => {
		saveWeeklySnapshot("Low", 50, 1);
		saveWeeklySnapshot("High", 500, 20);
		saveWeeklySnapshot("Mid", 250, 15);

		const entries = getWeeklyLeaderboard();
		const nonUserEntries = entries.filter((e) => !e.isCurrentUser);
		for (let i = 1; i < nonUserEntries.length; i++) {
			expect(nonUserEntries[i - 1].xp).toBeGreaterThanOrEqual(
				nonUserEntries[i].xp,
			);
		}
	});

	test("caps at 10 total entries (self + 9)", () => {
		for (let i = 0; i < 15; i++) {
			saveWeeklySnapshot(`Student ${i}`, i * 10, i);
		}
		const entries = getWeeklyLeaderboard();
		expect(entries.length).toBeLessThanOrEqual(10);
	});

	test("filters out entries older than 1 week", () => {
		const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000;
		mockStorage.set("lumni_leaderboard_history", [
			{
				label: "Old Student",
				xp: 999,
				streak: 50,
				timestamp: oldTimestamp,
			},
		]);
		const entries = getWeeklyLeaderboard();
		const old = entries.find((e) => e.label === "Old Student");
		expect(old).toBeUndefined();
	});
});
