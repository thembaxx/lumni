import { describe, expect, test } from "bun:test";
import { SafePersistError, safePersist } from "../persist";

describe("safePersist", () => {
	test("returns function result on success", async () => {
		const result = await safePersist("test", async () => "success");
		expect(result).toBe("success");
	});

	test("returns numeric result", async () => {
		const result = await safePersist("calc", async () => 42);
		expect(result).toBe(42);
	});

	test("handles void return", async () => {
		const result = await safePersist("void", async () => {});
		expect(result).toBeUndefined();
	});

	test("throws SafePersistError when function throws", async () => {
		const fn = async () => {
			throw new Error("db error");
		};
		await expect(safePersist("write", fn)).rejects.toThrow(SafePersistError);
	});

	test("SafePersistError carries label and cause", async () => {
		const cause = new Error("underlying error");
		try {
			await safePersist("my-label", async () => {
				throw cause;
			});
		} catch (err) {
			expect(err).toBeInstanceOf(SafePersistError);
			expect((err as SafePersistError).label).toBe("my-label");
			expect((err as SafePersistError).cause).toBe(cause);
			expect((err as SafePersistError).message).toContain("my-label");
		}
	});
});
