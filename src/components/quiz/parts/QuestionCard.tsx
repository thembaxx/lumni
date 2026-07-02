"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { Confetti, XPGainPopup } from "@/components/celebration";
import { Anim } from "@/components/shared/anim";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { useSolver } from "@/hooks/use-solver";
import { useVisualEngine } from "@/hooks/use-visual-engine";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { useBookmarksStore } from "@/store/bookmarks";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";

interface QuestionState {
  selectedOption: string | null;
  isCorrect: boolean | null;
  showHint: boolean;
  showExplanation: boolean;
  isSubmitted: boolean;
  showDiagram: boolean;
  calcValue: string;
  code: string;
}

import { QuestionCardControls } from "./QuestionCardControls";
import { QuestionCardFeedback } from "./QuestionCardFeedback";
import { QuestionCardHeader } from "./QuestionCardHeader";
import { QuestionCardInput } from "./QuestionCardInput";
import { QuestionCardMedia } from "./QuestionCardMedia";

interface QuestionCardProps {
  question: Question;
  subject?: string;
  topic?: string;
  questionNumber?: number;
  totalQuestions?: number;
  onNext?: () => void;
  onAnswered?: (correct: boolean, score: number, answer?: UserAnswer) => void;
}

const MATH_SUBJECTS = [
  "mathematics",
  "technical-mathematics",
  "physical-sciences",
  "mathematical-literacy",
];

type GradeResult = { correct: boolean; score: number; feedback: string } | null;

type GradingState = {
  gradeResult: GradeResult;
  isGrading: boolean;
};

type GradingAction =
  | { type: "START_GRADING" }
  | { type: "FINISH_GRADING"; payload: { result: GradeResult } }
  | { type: "GRADE_FAILED" };

function gradingReducer(state: GradingState, action: GradingAction): GradingState {
  switch (action.type) {
    case "START_GRADING":
      return { ...state, isGrading: true };
    case "FINISH_GRADING":
      return { isGrading: false, gradeResult: action.payload.result };
    case "GRADE_FAILED":
      return {
        isGrading: false,
        gradeResult: {
          correct: false,
          score: 0,
          feedback: "Grading failed. Please try again.",
        },
      };
    default:
      return state;
  }
}

type FollowUpState = {
  messages: { role: "user" | "assistant"; content: string }[];
  input: string;
};

type FollowUpAction =
  | { type: "ADD_ASSISTANT"; payload: string }
  | { type: "SEND_MESSAGE"; payload: string }
  | { type: "SET_INPUT"; payload: string };

function followUpReducer(state: FollowUpState, action: FollowUpAction): FollowUpState {
  switch (action.type) {
    case "ADD_ASSISTANT":
      return {
        ...state,
        messages: [...state.messages, { role: "assistant", content: action.payload }],
      };
    case "SEND_MESSAGE":
      return {
        messages: [...state.messages, { role: "user", content: action.payload }],
        input: "",
      };
    case "SET_INPUT":
      return { ...state, input: action.payload };
    default:
      return state;
  }
}
export function QuestionCard({
  question,
  subject: subjectProp,
  topic: topicProp,
  questionNumber,
  totalQuestions,
  onNext,
  onAnswered,
}: QuestionCardProps) {
  const effectiveSubject = subjectProp || topicProp || "";

  const { push } = useNavigationDirection();

  const [state, setState] = useState<QuestionState>({
    selectedOption: null,
    isCorrect: null,
    showHint: false,
    showExplanation: false,
    isSubmitted: false,
    showDiagram: true,
    calcValue: "",
    code: "",
  });

  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPGain, setShowXPGain] = useState(false);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarksStore();
  const bookmarked = isBookmarked(question.id);
  const [{ gradeResult, isGrading }, dispatchGrading] = useReducer(gradingReducer, {
    gradeResult: null,
    isGrading: false,
  });
  const effectiveSubjectLower = effectiveSubject.toLowerCase();
  const isMathSubject = MATH_SUBJECTS.some((s) => effectiveSubjectLower.includes(s));

  const { grade } = useQuestionEngine();

  const { data: visual, isLoading: visualLoading } = useVisualEngine(question);

  const solver = useSolver();
  const [{ messages: followUpMsgs, input: followUpInput }, dispatchFollowUp] = useReducer(
    followUpReducer,
    { messages: [], input: "" },
  );

  useEffect(() => {
    useBookmarksStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (solver.followUpData?.answer) {
      dispatchFollowUp({
        type: "ADD_ASSISTANT",
        payload: solver.followUpData?.answer ?? "",
      });
    }
  }, [solver.followUpData]);

  const handleFollowUp = useCallback(() => {
    const text = followUpInput.trim();
    if (!text || !solver.data) return;
    dispatchFollowUp({ type: "SEND_MESSAGE", payload: text });
    solver.followUp({
      question: text,
      context: [
        {
          role: "assistant",
          content: solver.data.solution || solver.data.steps?.join("\n") || "",
        },
        { role: "user", content: question.questionText },
      ],
      subject: effectiveSubject,
    });
  }, [followUpInput, solver, effectiveSubject, question.questionText]);

  const isMultiPart =
    question.type === "source-based" ||
    question.type === "data-response" ||
    question.type === "mixed";
  const isSolverEnabled = !isMultiPart;

  const isMCQ = question.type === "multiple-choice";
  const mcqBody = isMCQ ? (question as Question<"multiple-choice">).body : null;
  const options = mcqBody?.options ?? [];
  const hasDiagram = (question.media?.length ?? 0) > 0 || !!visual;

  const visualDescription = visual?.label
    ? `The question includes a visual: ${visual.label}`
    : undefined;

  const handleGrade = useCallback(
    async (answer: UserAnswer) => {
      dispatchGrading({ type: "START_GRADING" });
      try {
        const result = await grade(question, answer);
        dispatchGrading({ type: "FINISH_GRADING", payload: { result } });
        setState((prev) => ({
          ...prev,
          isSubmitted: true,
          isCorrect: result.correct,
          showExplanation: true,
        }));
        if (result.correct) {
          setShowConfetti(true);
          setShowXPGain(true);
          setTimeout(() => setShowConfetti(false), 2000);
          setTimeout(() => setShowXPGain(false), 1500);
        }
        onAnswered?.(result.correct, result.score, answer);
      } catch {
        dispatchGrading({ type: "GRADE_FAILED" });
        setState((prev) => ({
          ...prev,
          isSubmitted: true,
          showExplanation: true,
        }));
      }
    },
    [grade, question, onAnswered],
  );

  const handleMCQSelect = useCallback(
    (optionId: string) => {
      if (state.isSubmitted) return;
      setState((prev) => ({ ...prev, selectedOption: optionId }));
    },
    [state.isSubmitted],
  );

  const handleMCQSubmit = useCallback(() => {
    if (!state.selectedOption || question.type !== "multiple-choice") return;
    const body = question.body as Question<"multiple-choice">["body"];
    const opts = body?.options ?? [];
    const selectedOpt = opts.find((opt) => opt.id === state.selectedOption);
    if (!selectedOpt) return;
    handleGrade({ type: "option-ids", value: [selectedOpt.id] });
  }, [state.selectedOption, question, handleGrade]);

  const handleToggleDiagram = () => {
    setState((prev) => ({ ...prev, showDiagram: !prev.showDiagram }));
  };

  const onBookmarkToggle = useCallback(() => {
    if (bookmarked) {
      removeBookmark(question.id);
    } else {
      addBookmark({
        id: question.id,
        questionText: question.questionText,
        subject: question.subject,
        topic: question.topic,
      });
    }
  }, [
    bookmarked,
    question.id,
    question.questionText,
    question.subject,
    question.topic,
    addBookmark,
    removeBookmark,
  ]);

  return (
    <Anim layoutId="question-card">
      <Confetti trigger={showConfetti} count={30} duration={1500} />
      <XPGainPopup amount={15} visible={showXPGain} />
      <QuestionCardHeader
        question={question}
        effectiveSubject={effectiveSubject}
        bookmarked={bookmarked}
        onBookmarkToggle={onBookmarkToggle}
        isMathSubject={isMathSubject}
        onToolClick={() => push("/solve?camera=1")}
        visualDescription={visualDescription}
      />
      <QuestionCardMedia
        visual={visual}
        isLoading={visualLoading}
        questionMedia={question.media ?? []}
        showDiagram={state.showDiagram}
        onToggleDiagram={handleToggleDiagram}
        hasDiagram={hasDiagram}
      />
      <QuestionCardInput
        question={question}
        effectiveSubject={effectiveSubject}
        state={state}
        options={options}
        calcValue={state.calcValue}
        setCalcValue={(next) => {
          setState((prev) => ({
            ...prev,
            calcValue: typeof next === "function" ? next(prev.calcValue) : next,
          }));
        }}
        code={state.code}
        setCode={(next) => {
          setState((prev) => ({
            ...prev,
            code: typeof next === "function" ? next(prev.code) : next,
          }));
        }}
        handleMCQSelect={handleMCQSelect}
        handleMCQSubmit={handleMCQSubmit}
        handleGrade={handleGrade}
      />
      <QuestionCardFeedback
        state={state}
        gradeResult={gradeResult}
        question={question}
        effectiveSubject={effectiveSubject}
        options={{
          isCorrect: state.isCorrect,
          showExplanation: state.showExplanation,
          isGrading,
          isSolverEnabled,
        }}
        solver={solver}
        followUpMsgs={followUpMsgs}
        handleFollowUp={handleFollowUp}
        followUpInput={followUpInput}
        setFollowUpInput={(next) =>
          dispatchFollowUp({
            type: "SET_INPUT",
            payload: typeof next === "function" ? next(followUpInput) : next,
          })
        }
      />
      <QuestionCardControls
        onNext={onNext}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
      />
    </Anim>
  );
}
