import { beforeEach, describe, expect, test } from "bun:test";
import type { ExamPaper, QuestionPart } from "@/types/exam-paper";

function makePart(
	id: string,
	overrides: Partial<QuestionPart> = {},
): QuestionPart {
	return { id, type: "short-answer", marks: 2, ...overrides };
}

function makePaper(overrides: Partial<ExamPaper> = {}): ExamPaper {
	return {
		metadata: {
			subject: "mathematics",
			paperCode: "P1",
			examPeriod: "June 2026",
			year: 2026,
			grade: 12,
			qualification: "NSC",
			language: "English",
			totalMarks: 150,
			duration: "3 hours",
		},
		instructions: ["Answer all questions"],
		sections: [
			{
				id: "section-a",
				questions: [
					{
						id: "q1",
						parts: [makePart("p1")],
					},
					{
						id: "q2",
						parts: [makePart("p2"), makePart("p3")],
					},
				],
			},
			{
				id: "section-b",
				questions: [
					{
						id: "q3",
						parts: [makePart("p4")],
					},
				],
			},
		],
		...overrides,
	};
}

const { useExamSessionStore } = await import("../exam-session");

beforeEach(() => {
	useExamSessionStore.getState().resetSession();
});

describe("useExamSessionStore", () => {
	test("initial state is empty", () => {
		const state = useExamSessionStore.getState();
		expect(state.paper).toBeNull();
		expect(state.paperId).toBeNull();
		expect(state.answers).toEqual({});
		expect(state.flags).toEqual([]);
		expect(state.completed).toBe(false);
	});

	test("initSession sets up the exam state", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		const state = useExamSessionStore.getState();
		expect(state.paper).not.toBeNull();
		expect(state.paperId).toBe("paper-1");
		expect(state.sessionId).not.toBeNull();
		expect(state.timeRemaining).toBe(180 * 60);
		expect(state.startedAt).not.toBeNull();
		expect(state.completed).toBe(false);
	});

	test("initSession sets currentPartId to first part", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		expect(useExamSessionStore.getState().currentPartId).toBe(
			"section-a-q1-p1",
		);
	});

	test("initSession initialises answers and flags empty", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		expect(useExamSessionStore.getState().answers).toEqual({});
		expect(useExamSessionStore.getState().flags).toEqual([]);
	});

	test("setAnswer stores answer for a part", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		useExamSessionStore.getState().setAnswer("section-a-q1-p1", "42");
		const answer = useExamSessionStore.getState().answers["section-a-q1-p1"];
		expect(answer.value).toBe("42");
		expect(answer.answeredAt).toBeDefined();
	});

	test("setAnswer preserves existing answers", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		useExamSessionStore.getState().setAnswer("section-a-q1-p1", "42");
		useExamSessionStore.getState().setAnswer("section-a-q2-p2", "math");
		expect(Object.keys(useExamSessionStore.getState().answers).length).toBe(2);
	});

	test("setAnswer overwrites existing answer for same part", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		useExamSessionStore.getState().setAnswer("section-a-q1-p1", "42");
		useExamSessionStore.getState().setAnswer("section-a-q1-p1", "100");
		expect(
			useExamSessionStore.getState().answers["section-a-q1-p1"].value,
		).toBe("100");
	});

	test("toggleFlag adds a flag", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		useExamSessionStore.getState().toggleFlag("section-a-q1-p1");
		expect(useExamSessionStore.getState().flags).toContain("section-a-q1-p1");
	});

	test("toggleFlag removes an existing flag", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		useExamSessionStore.getState().toggleFlag("section-a-q1-p1");
		useExamSessionStore.getState().toggleFlag("section-a-q1-p1");
		expect(useExamSessionStore.getState().flags).not.toContain(
			"section-a-q1-p1",
		);
	});

	test("getFlatParts returns all parts with section and question ids", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		const flat = useExamSessionStore.getState().getFlatParts();
		expect(flat).toHaveLength(4);
		expect(flat[0]).toEqual({
			sectionId: "section-a",
			questionId: "q1",
			part: expect.objectContaining({ id: "p1" }),
		});
		expect(flat[3]).toEqual({
			sectionId: "section-b",
			questionId: "q3",
			part: expect.objectContaining({ id: "p4" }),
		});
	});

	test("getFlatParts returns empty when no paper", () => {
		expect(useExamSessionStore.getState().getFlatParts()).toEqual([]);
	});

	test("getAnsweredCount returns number of answered parts", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		expect(useExamSessionStore.getState().getAnsweredCount()).toBe(0);
		useExamSessionStore.getState().setAnswer("section-a-q1-p1", "42");
		expect(useExamSessionStore.getState().getAnsweredCount()).toBe(1);
	});

	test("getTotalPartsCount returns total parts", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		expect(useExamSessionStore.getState().getTotalPartsCount()).toBe(4);
	});

	test("getAnswer returns answer value by part id", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		useExamSessionStore.getState().setAnswer("section-a-q1-p1", "42");
		expect(useExamSessionStore.getState().getAnswer("section-a-q1-p1")).toBe(
			"42",
		);
	});

	test("getAnswer returns undefined for unanswered part", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		expect(
			useExamSessionStore.getState().getAnswer("nonexistent"),
		).toBeUndefined();
	});

	test("isFlagged returns correct status", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		expect(useExamSessionStore.getState().isFlagged("section-a-q1-p1")).toBe(
			false,
		);
		useExamSessionStore.getState().toggleFlag("section-a-q1-p1");
		expect(useExamSessionStore.getState().isFlagged("section-a-q1-p1")).toBe(
			true,
		);
	});

	test("tick decrements timeRemaining", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		const before = useExamSessionStore.getState().timeRemaining;
		useExamSessionStore.getState().tick();
		expect(useExamSessionStore.getState().timeRemaining).toBe(before - 1);
	});

	test("tick stops at 0", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		useExamSessionStore.setState({ timeRemaining: 0 });
		useExamSessionStore.getState().tick();
		expect(useExamSessionStore.getState().timeRemaining).toBe(0);
	});

	test("tick does not decrement when completed", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		useExamSessionStore.getState().completeSession();
		const before = useExamSessionStore.getState().timeRemaining;
		useExamSessionStore.getState().tick();
		expect(useExamSessionStore.getState().timeRemaining).toBe(before);
	});

	test("setCurrentPart updates currentPartId", () => {
		useExamSessionStore.getState().setCurrentPart("section-a-q2-p2");
		expect(useExamSessionStore.getState().currentPartId).toBe(
			"section-a-q2-p2",
		);
	});

	test("completeSession marks session as completed", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		useExamSessionStore.getState().completeSession();
		expect(useExamSessionStore.getState().completed).toBe(true);
		expect(useExamSessionStore.getState().isSubmitting).toBe(false);
	});

	test("setSubmitting updates isSubmitting", () => {
		useExamSessionStore.getState().setSubmitting(true);
		expect(useExamSessionStore.getState().isSubmitting).toBe(true);
	});

	test("resetSession returns to initial state", () => {
		const paper = makePaper();
		useExamSessionStore.getState().initSession(paper, "paper-1", 180);
		useExamSessionStore.getState().setAnswer("section-a-q1-p1", "42");
		useExamSessionStore.getState().resetSession();
		const state = useExamSessionStore.getState();
		expect(state.paper).toBeNull();
		expect(state.paperId).toBeNull();
		expect(state.answers).toEqual({});
		expect(state.flags).toEqual([]);
		expect(state.currentPartId).toBeNull();
		expect(state.completed).toBe(false);
	});

	test("handles paper with empty sections", () => {
		const emptyPaper = makePaper({ sections: [] });
		useExamSessionStore.getState().initSession(emptyPaper, "empty", 60);
		expect(useExamSessionStore.getState().currentPartId).toBeNull();
		expect(useExamSessionStore.getState().getFlatParts()).toEqual([]);
	});
});
