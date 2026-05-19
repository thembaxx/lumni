import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockShare = mock<(data: { title: string; text: string; url: string }) => Promise<void>>();
const mockClipboardWrite = mock<(text: string) => Promise<void>>();

Object.defineProperty(globalThis, "navigator", {
	value: {
		share: mockShare,
		clipboard: {
			writeText: mockClipboardWrite,
		},
	},
	writable: true,
	configurable: true,
});

const { shareReferral, copyToClipboard, generateQRDataUrl } = await import("../client");

describe("shareReferral", () => {
	beforeEach(() => {
		mockShare.mockReset();
		mockClipboardWrite.mockReset();
	});

	test("calls navigator.share when available", async () => {
		mockShare.mockResolvedValue(undefined);

		await shareReferral("https://lumni.vercel.app", "LUMNI-ABC");

		expect(mockShare).toHaveBeenCalledTimes(1);
		expect(mockShare).toHaveBeenCalledWith({
			title: "Join me on Lumni",
			text: "Study with me on Lumni! Use my code LUMNI-ABC",
			url: "https://lumni.vercel.app",
		});
	});

	test("falls back to clipboard when navigator.share is undefined", async () => {
		Object.defineProperty(globalThis, "navigator", {
			value: {
				share: undefined,
				clipboard: {
					writeText: mockClipboardWrite,
				},
			},
			writable: true,
			configurable: true,
		});

		mockClipboardWrite.mockResolvedValue(undefined);

		await shareReferral("https://lumni.vercel.app", "LUMNI-ABC");

		expect(mockClipboardWrite).toHaveBeenCalledTimes(1);
		expect(mockClipboardWrite).toHaveBeenCalledWith("LUMNI-ABC — https://lumni.vercel.app");
	});
});

describe("copyToClipboard", () => {
	beforeEach(() => {
		mockClipboardWrite.mockReset();
	});

	test("returns true on successful clipboard write", async () => {
		mockClipboardWrite.mockResolvedValue(undefined);

		const result = await copyToClipboard("hello");

		expect(result).toBe(true);
		expect(mockClipboardWrite).toHaveBeenCalledWith("hello");
	});

	test("returns false when clipboard write fails", async () => {
		mockClipboardWrite.mockRejectedValue(new Error("Clipboard denied"));

		const result = await copyToClipboard("hello");

		expect(result).toBe(false);
	});
});

describe("generateQRDataUrl", () => {
	test("returns a QR code URL with encoded link", () => {
		const url = generateQRDataUrl("https://lumni.vercel.app/auth/sign-up?ref=LUMNI-ABC");
		expect(url).toContain("api.qrserver.com");
		expect(url).toContain("size=200x200");
		expect(url).toContain(encodeURIComponent("https://lumni.vercel.app/auth/sign-up?ref=LUMNI-ABC"));
	});

	test("encodes special characters in link", () => {
		const url = generateQRDataUrl("https://example.com/?a=b&c=d");
		expect(url).toContain(encodeURIComponent("https://example.com/?a=b&c=d"));
	});
});
