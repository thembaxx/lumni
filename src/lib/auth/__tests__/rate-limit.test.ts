import { describe, expect, test } from "bun:test";
import {
	attemptSignIn,
	attemptMagicLink,
	recordSuccessfulSignIn,
} from "../rate-limit";

function uniqueEmail(): string {
	return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

describe("attemptSignIn", () => {
	test("returns allowed on first attempt", () => {
		const result = attemptSignIn(uniqueEmail());
		expect(result).toEqual({ allowed: true });
	});

	test("blocks after too many attempts", () => {
		const email = uniqueEmail();
		attemptSignIn(email);
		attemptSignIn(email);
		attemptSignIn(email);
		const result = attemptSignIn(email);
		expect(result.allowed).toBe(false);
		expect(
			(result as { errorMessage: string }).errorMessage,
		).toContain("sign-in");
	});

	test("normalizes email case", () => {
		const email = uniqueEmail();
		attemptSignIn(email.toUpperCase());
		attemptSignIn(email);
		attemptSignIn(email.toUpperCase());
		const result = attemptSignIn(email);
		expect(result.allowed).toBe(false);
	});

	test("normalizes email with whitespace", () => {
		const email = uniqueEmail();
		attemptSignIn(email);
		attemptSignIn(email);
		attemptSignIn(`  ${email}  `);
		const result = attemptSignIn(email);
		expect(result.allowed).toBe(false);
	});
});

describe("recordSuccessfulSignIn", () => {
	test("resets rate limit for the email", () => {
		const email = uniqueEmail();
		attemptSignIn(email);
		attemptSignIn(email);
		attemptSignIn(email);
		recordSuccessfulSignIn(email);
		const result = attemptSignIn(email);
		expect(result).toEqual({ allowed: true });
	});
});

describe("attemptMagicLink", () => {
	test("returns allowed on first attempt", () => {
		const result = attemptMagicLink(uniqueEmail());
		expect(result).toEqual({ allowed: true });
	});

	test("blocks on second attempt", () => {
		const email = uniqueEmail();
		attemptMagicLink(email);
		const result = attemptMagicLink(email);
		expect(result.allowed).toBe(false);
		expect(
			(result as { errorMessage: string }).errorMessage,
		).toContain("magic link");
	});
});
