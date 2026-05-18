import { describe, expect, test } from "bun:test";
import { formatBytes } from "../format";

describe("formatBytes", () => {
	test('returns "0 B" for zero bytes', () => {
		expect(formatBytes(0)).toBe("0 B");
	});

	test("formats bytes", () => {
		expect(formatBytes(500)).toBe("500 B");
		expect(formatBytes(1023)).toBe("1023 B");
	});

	test("formats kilobytes", () => {
		expect(formatBytes(1024)).toBe("1 KB");
		expect(formatBytes(2048)).toBe("2 KB");
		expect(formatBytes(1536)).toBe("1.5 KB");
	});

	test("formats megabytes", () => {
		expect(formatBytes(1048576)).toBe("1 MB");
		expect(formatBytes(1572864)).toBe("1.5 MB");
	});

	test("formats gigabytes", () => {
		expect(formatBytes(1073741824)).toBe("1 GB");
		expect(formatBytes(1610612736)).toBe("1.5 GB");
	});

	test("handles large numbers into GB", () => {
		const result = formatBytes(10737418240);
		expect(result).toBe("10 GB");
	});
});
