import { describe, expect, test } from "bun:test";
import { getReadableErrorMessage } from "../errors";

describe("getReadableErrorMessage", () => {
	test("returns default message for unknown errors", () => {
		const result = getReadableErrorMessage(new Error("Something broke"));
		expect(result).toBe("Something broke");
	});

	test("handles non-Error input", () => {
		const result = getReadableErrorMessage("just a string");
		expect(result).toBe("Something went wrong");
	});

	test("translates 'already exists' to sign-in prompt", () => {
		const result = getReadableErrorMessage(
			new Error("A user with this email already exists"),
		);
		expect(result).toBe(
			"An account with this email already exists. Sign in instead.",
		);
	});

	test("translates 'already registered' to sign-in prompt", () => {
		const result = getReadableErrorMessage(
			new Error("Account already registered"),
		);
		expect(result).toBe(
			"An account with this email already exists. Sign in instead.",
		);
	});

	test("translates 'invalid credentials'", () => {
		const result = getReadableErrorMessage(new Error("Invalid credentials"));
		expect(result).toBe("Incorrect email or password. Try again.");
	});

	test("translates 'user not found'", () => {
		const result = getReadableErrorMessage(
			new Error("User with this email not found"),
		);
		expect(result).toBe(
			"No account found with this email. Create an account instead.",
		);
	});

	test("translates 'invalid email'", () => {
		const result = getReadableErrorMessage(new Error("Invalid email address"));
		expect(result).toBe("Enter a valid email address.");
	});

	test("translates 'missing' field errors", () => {
		const result = getReadableErrorMessage(new Error("Missing required field"));
		expect(result).toBe("Please fill in all required fields.");
	});

	test("translates network errors", () => {
		const result = getReadableErrorMessage(new Error("Network request failed"));
		expect(result).toBe(
			"Couldn't connect. Check your internet connection and try again.",
		);
	});

	test("translates rate limit errors", () => {
		const result = getReadableErrorMessage(new Error("Too many requests"));
		expect(result).toBe(
			"Too many attempts. Please wait a moment and try again.",
		);
	});

	test("translates short password errors", () => {
		const result = getReadableErrorMessage(
			new Error("Password must be a minimum of 8 characters in length"),
		);
		expect(result).toBe("Password must be at least 8 characters.");
	});

	test("translates expired session errors", () => {
		const result = getReadableErrorMessage(new Error("Session has expired"));
		expect(result).toBe("Your session expired. Please sign in again.");
	});

	test("translates expired verification link", () => {
		const result = getReadableErrorMessage(
			new Error("Verification token is invalid"),
		);
		expect(result).toBe(
			"This verification link has expired or is invalid. Request a new one.",
		);
	});
});
