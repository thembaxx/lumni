import { describe, expect, test } from "bun:test";

const { parseExamPaperFilename, getSubjectName } = await import(
	"../exams/schema"
);

describe("parseExamPaperFilename", () => {
	test("parses standard paper filename", () => {
		const r = parseExamPaperFilename("2024_mathematics_p1.pdf") as NonNullable<
			ReturnType<typeof parseExamPaperFilename>
		>;
		expect(r).not.toBeNull();
		expect(r.year).toBe(2024);
		expect(r.subjectCode).toBe("mathematics");
		expect(r.paperNumber).toBe(1);
		expect(r.type).toBe("paper");
	});

	test("parses memo filename", () => {
		const r = parseExamPaperFilename(
			"2024_physical-sciences_p2_memo.pdf",
		) as NonNullable<ReturnType<typeof parseExamPaperFilename>>;
		expect(r).not.toBeNull();
		expect(r.year).toBe(2024);
		expect(r.subjectCode).toBe("physical-sciences");
		expect(r.paperNumber).toBe(2);
		expect(r.type).toBe("memo");
	});

	test("defaults paperNumber to 1 when omitted", () => {
		const r = parseExamPaperFilename("2024_accounting.pdf") as NonNullable<
			ReturnType<typeof parseExamPaperFilename>
		>;
		expect(r).not.toBeNull();
		expect(r.paperNumber).toBe(1);
		expect(r.type).toBe("paper");
	});

	test("returns null for invalid filenames", () => {
		expect(parseExamPaperFilename("")).toBeNull();
		expect(parseExamPaperFilename("random.txt")).toBeNull();
		expect(parseExamPaperFilename("2024_.pdf")).toBeNull();
	});

	test("handles underscore-separated subject names", () => {
		const r = parseExamPaperFilename(
			"2023_computer_applications_technology_p1.pdf",
		) as NonNullable<ReturnType<typeof parseExamPaperFilename>>;
		expect(r).not.toBeNull();
		expect(r.subjectCode).toBe("computer-applications-technology");
		expect(r.subjectName).toBe("Computer Applications Technology");
	});
});

describe("getSubjectName", () => {
	test("returns mapped names for known codes", () => {
		expect(getSubjectName("mathematics")).toBe("Mathematics");
		expect(getSubjectName("physical-sciences")).toBe("Physical Sciences");
		expect(getSubjectName("life-sciences")).toBe("Life Sciences");
		expect(getSubjectName("accounting")).toBe("Accounting");
		expect(getSubjectName("history")).toBe("History");
		expect(getSubjectName("geography")).toBe("Geography");
	});

	test("falls back to title-cased code for unknown codes", () => {
		expect(getSubjectName("unknown-subject")).toBe("Unknown Subject");
	});
});
