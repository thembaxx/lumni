import { describe, expect, test } from "bun:test";
import { getStreakMessage, rarityColors, rarityGlow, raritySolid } from "../gamification";

describe("getStreakMessage", () => {
	test('streak <= 0 returns "Start your streak!"', () => {
		expect(getStreakMessage(0)).toBe("Start your streak!");
		expect(getStreakMessage(-5)).toBe("Start your streak!");
	});

	test("streak 1 returns Keep it up!", () => {
		expect(getStreakMessage(1)).toBe("Keep it up!");
	});

	test("streak 3 returns On Fire!", () => {
		expect(getStreakMessage(3)).toBe("On Fire!");
	});

	test("streak 7 returns Week Warrior!", () => {
		expect(getStreakMessage(7)).toBe("Week Warrior!");
	});

	test("streak 14 returns Unstoppable!", () => {
		expect(getStreakMessage(14)).toBe("Unstoppable!");
	});

	test("streak 30 returns Legendary!", () => {
		expect(getStreakMessage(30)).toBe("Legendary!");
	});

	test("streak 60 returns Grandmaster!", () => {
		expect(getStreakMessage(60)).toBe("Grandmaster!");
	});

	test("streak 100 returns Lumni Legend!", () => {
		expect(getStreakMessage(100)).toBe("Lumni Legend!");
	});

	test("returns message for the nearest lower threshold", () => {
		expect(getStreakMessage(2)).toBe("Keep it up!");
		expect(getStreakMessage(5)).toBe("On Fire!");
		expect(getStreakMessage(10)).toBe("Week Warrior!");
	});

	test("above highest threshold returns the max message", () => {
		expect(getStreakMessage(200)).toBe("Lumni Legend!");
	});
});

describe("rarity maps", () => {
	test("rarityColors has all rarities", () => {
		expect(rarityColors).toHaveProperty("common");
		expect(rarityColors).toHaveProperty("rare");
		expect(rarityColors).toHaveProperty("epic");
		expect(rarityColors).toHaveProperty("legendary");
	});

	test("rarityGlow has all rarities", () => {
		expect(rarityGlow).toHaveProperty("common");
		expect(rarityGlow).toHaveProperty("rare");
		expect(rarityGlow).toHaveProperty("epic");
	});

	test("raritySolid has all rarities", () => {
		expect(raritySolid).toHaveProperty("common");
		expect(raritySolid).toHaveProperty("rare");
		expect(raritySolid).toHaveProperty("epic");
		expect(raritySolid).toHaveProperty("legendary");
	});
});
