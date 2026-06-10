import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
	attemptMagicLink,
	attemptSignIn,
	recordSuccessfulSignIn,
} from "../rate-limit";

function uniqueEmail(): string {
	return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

const originalFetch = globalThis.fetch;

beforeAll(() => {
	globalThis.fetch = (() => {
		throw new Error("fetch should not be called in tests");
	}) as unknown as typeof globalThis.fetch;
});

afterAll(() => {
	globalThis.fetch = originalFetch;
});

describe("attemptSignIn", () => {
	test("returns allowed on first attempt", async () => {
		const result = await attemptSignIn(uniqueEmail());
		expect(result).toEqual({ allowed: true });
	});

	test("blocks after too many attempts", async () => {
		const email = uniqueEmail();
		await attemptSignIn(email);
		await attemptSignIn(email);
		await attemptSignIn(email);
		const result = await attemptSignIn(email);
		expect(result.allowed).toBe(false);
		expect((result as { errorMessage: string }).errorMessage).toContain(
			"sign-in",
		);
	});

	test("normalizes email case", async () => {
		const email = uniqueEmail();
		await attemptSignIn(email.toUpperCase());
		await attemptSignIn(email);
		await attemptSignIn(email.toUpperCase());
		const result = await attemptSignIn(email);
		expect(result.allowed).toBe(false);
	});

	test("normalizes email with whitespace", async () => {
		const email = uniqueEmail();
		await attemptSignIn(email);
		await attemptSignIn(email);
		await attemptSignIn(`  ${email}  `);
		const result = await attemptSignIn(email);
		expect(result.allowed).toBe(false);
	});
});

describe("recordSuccessfulSignIn", () => {
	test("resets rate limit for the email", async () => {
		const email = uniqueEmail();
		await attemptSignIn(email);
		await attemptSignIn(email);
		await attemptSignIn(email);
		await recordSuccessfulSignIn(email);
		const result = await attemptSignIn(email);
		expect(result).toEqual({ allowed: true });
	});
});

describe("attemptMagicLink", () => {
	test("returns allowed on first attempt", async () => {
		const result = await attemptMagicLink(uniqueEmail());
		expect(result).toEqual({ allowed: true });
	});

	test("blocks on second attempt", async () => {
		const email = uniqueEmail();
		await attemptMagicLink(email);
		const result = await attemptMagicLink(email);
		expect(result.allowed).toBe(false);
		expect((result as { errorMessage: string }).errorMessage).toContain(
			"magic link",
		);
	});
});
