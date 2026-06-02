import { afterEach, describe, expect, test } from "bun:test";
import {
	clearInFlight,
	deduped,
	hasInFlight,
	inFlightSize,
} from "../in-flight";

afterEach(() => {
	clearInFlight();
});

describe("deduped", () => {
	test("runs factory once when called multiple times with same key", async () => {
		let callCount = 0;
		const factory = async () => {
			callCount++;
			await new Promise((r) => setTimeout(r, 5));
			return "result";
		};

		const promises = [
			deduped("key1", factory),
			deduped("key1", factory),
			deduped("key1", factory),
		];
		const results = await Promise.all(promises);

		expect(callCount).toBe(1);
		expect(results).toEqual(["result", "result", "result"]);
	});

	test("runs factory separately for different keys", async () => {
		let countA = 0;
		let countB = 0;

		const [a, b] = await Promise.all([
			deduped("key-a", async () => {
				countA++;
				return "a";
			}),
			deduped("key-b", async () => {
				countB++;
				return "b";
			}),
		]);

		expect(countA).toBe(1);
		expect(countB).toBe(1);
		expect(a).toBe("a");
		expect(b).toBe("b");
	});

	test("clears in-flight entry after resolve", async () => {
		await deduped("k1", async () => "done");
		expect(hasInFlight("k1")).toBe(false);
		expect(inFlightSize()).toBe(0);
	});

	test("clears in-flight entry after reject", async () => {
		await expect(
			deduped("k2", async () => {
				throw new Error("boom");
			}),
		).rejects.toThrow("boom");
		expect(hasInFlight("k2")).toBe(false);
	});

	test("re-fetches after previous promise rejected", async () => {
		let count = 0;
		await expect(
			deduped("k3", async () => {
				count++;
				throw new Error("first");
			}),
		).rejects.toThrow();

		const result = await deduped("k3", async () => {
			count++;
			return "ok";
		});
		expect(count).toBe(2);
		expect(result).toBe("ok");
	});

	test("propagates factory errors", async () => {
		await expect(
			deduped("k4", async () => {
				throw new Error("specific");
			}),
		).rejects.toThrow("specific");
	});
});

describe("inFlightSize", () => {
	test("tracks in-flight count", async () => {
		const p1 = deduped(
			"a",
			() => new Promise((r) => setTimeout(() => r(1), 10)),
		);
		const p2 = deduped(
			"b",
			() => new Promise((r) => setTimeout(() => r(2), 10)),
		);
		expect(inFlightSize()).toBe(2);
		await Promise.all([p1, p2]);
		expect(inFlightSize()).toBe(0);
	});
});

describe("clearInFlight", () => {
	test("clears all pending", () => {
		void deduped("a", () => new Promise(() => {}));
		void deduped("b", () => new Promise(() => {}));
		expect(inFlightSize()).toBe(2);
		clearInFlight();
		expect(inFlightSize()).toBe(0);
	});
});
