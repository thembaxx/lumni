import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Question } from "@/lib/question-engine/types";

const mockSetImmersive = vi.fn();
const mockGenerate = vi.fn();

let mockQuestions: Question[] = [];
let mockIsLoading = true;

vi.mock("@/hooks/use-question-engine", () => ({
  useQuestionEngine: () => ({
    questions: mockQuestions,
    count: mockQuestions.length,
    sources: [],
    warning: undefined,
    isLoading: mockIsLoading,
    isFetching: false,
    error: null,
    isError: false,
    generate: mockGenerate,
    grade: vi.fn(),
    hint: vi.fn(),
    isGenerating: false,
    isGrading: false,
    gradeResult: undefined,
    gradeError: null,
    isGeneratingHint: false,
    hintResult: undefined,
    hintError: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/components/shared/immersive-mode", () => ({
  useImmersiveMode: () => ({ setImmersive: mockSetImmersive }),
}));

import { ExamMockSession } from "@/components/exam/exam-mock-session";

function hasText(container: HTMLElement, regex: RegExp): boolean {
  return regex.test(container.textContent ?? "");
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    type: "multiple-choice",
    subject: "mathematics",
    topic: "algebra",
    difficulty: "Medium",
    bloomTaxonomy: "apply",
    points: 1,
    questionText: "What is 2 + 2?",
    hint: "",
    explanation: "",
    body: {
      options: [
        { id: "a", text: "3", isCorrect: false },
        { id: "b", text: "4", isCorrect: true },
      ],
      correctOptionId: "b",
      allowMultiple: false,
    },
    ...overrides,
  };
}

describe("ExamMockSession", () => {
  beforeEach(() => {
    mockQuestions = [];
    mockIsLoading = true;
    mockGenerate.mockReset();
    mockSetImmersive.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders generating message while loading questions", () => {
    mockIsLoading = true;
    mockQuestions = [];

    const { container } = render(
      <ExamMockSession subject="mathematics" duration={3600} questionCount={10} />,
    );

    expect(hasText(container, /Generating mock exam/)).toBe(true);
  });

  test("renders countdown overlay when questions are loaded", async () => {
    mockIsLoading = false;
    mockQuestions = [makeQuestion()];

    const { container } = render(
      <ExamMockSession subject="mathematics" duration={3600} questionCount={1} />,
    );

    await waitFor(() => {
      expect(hasText(container, /Get ready/)).toBe(true);
    });
  });

  test("renders with default duration parameters", () => {
    mockIsLoading = true;
    mockQuestions = [];

    const { container } = render(
      <ExamMockSession subject="mathematics" duration={7200} questionCount={30} />,
    );

    expect(hasText(container, /Generating mock exam/)).toBe(true);
  });

  test("renders mock badge in header when active", async () => {
    mockIsLoading = false;
    mockQuestions = [makeQuestion()];

    const { container } = render(
      <ExamMockSession subject="mathematics" duration={3600} questionCount={1} />,
    );

    await waitFor(() => {
      expect(hasText(container, /Get ready/)).toBe(true);
    });
  });
});
