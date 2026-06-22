"use client";

import { useCallback, useReducer } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { GradingResult, Question } from "@/lib/question-engine/types";
import { apiFetch, showBudgetToast } from "@/lib/shared/api-fetch";

const QUESTION_TYPES = [
  "any",
  "multiple-choice",
  "matching",
  "short-answer",
  "long-answer",
  "essay",
  "calculation",
  "diagram",
  "programming",
  "source-based",
  "data-response",
  "mixed",
] as const;

interface DevEngineState {
  subject: string;
  topic: string;
  count: number;
  questionType: string;
  questions: Question[];
  grading: Record<string, GradingResult>;
  rawJson: string;
  isLoading: boolean;
  error: string;
}

const initialState: DevEngineState = {
  subject: "mathematics",
  topic: "algebra",
  count: 2,
  questionType: "any",
  questions: [],
  grading: {},
  rawJson: "",
  isLoading: false,
  error: "",
};

type DevEngineAction =
  | { type: "SET_SUBJECT"; payload: string }
  | { type: "SET_TOPIC"; payload: string }
  | { type: "SET_COUNT"; payload: number }
  | { type: "SET_QUESTION_TYPE"; payload: string }
  | { type: "GENERATE_START" }
  | {
      type: "GENERATE_SUCCESS";
      payload: { questions: Question[]; rawJson: string };
    }
  | { type: "GENERATE_ERROR"; payload: string }
  | {
      type: "GRADE_RESULT";
      payload: { questionId: string; result: GradingResult };
    };

function devEngineReducer(state: DevEngineState, action: DevEngineAction): DevEngineState {
  switch (action.type) {
    case "SET_SUBJECT":
      return { ...state, subject: action.payload };
    case "SET_TOPIC":
      return { ...state, topic: action.payload };
    case "SET_COUNT":
      return { ...state, count: action.payload };
    case "SET_QUESTION_TYPE":
      return { ...state, questionType: action.payload };
    case "GENERATE_START":
      return {
        ...state,
        isLoading: true,
        error: "",
        rawJson: "",
        questions: [],
        grading: {},
      };
    case "GENERATE_SUCCESS":
      return {
        ...state,
        isLoading: false,
        questions: action.payload.questions,
        rawJson: action.payload.rawJson,
      };
    case "GENERATE_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "GRADE_RESULT":
      return {
        ...state,
        grading: {
          ...state.grading,
          [action.payload.questionId]: action.payload.result,
        },
      };
    default:
      return state;
  }
}

export default function DevEnginePage() {
  const [state, dispatch] = useReducer(devEngineReducer, initialState);

  const handleGenerate = useCallback(async () => {
    dispatch({ type: "GENERATE_START" });
    try {
      const data = await apiFetch<{ questions?: Question[]; error?: string }>(
        "/api/engine/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: state.subject,
            topic: state.topic || undefined,
            count: state.count,
            questionType: state.questionType === "any" ? "any" : state.questionType,
          }),
        },
      );
      dispatch({
        type: "GENERATE_SUCCESS",
        payload: {
          questions: data.questions ?? [],
          rawJson: JSON.stringify(data, null, 2),
        },
      });
    } catch (err) {
      showBudgetToast(err);
      dispatch({
        type: "GENERATE_ERROR",
        payload: err instanceof Error ? err.message : "Network error",
      });
    }
  }, [state.subject, state.topic, state.count, state.questionType]);

  const handleGrade = useCallback(async (q: Question) => {
    try {
      const result = await apiFetch<GradingResult>("/api/engine/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          answer: { type: "text", value: "test answer" },
        }),
      });
      dispatch({ type: "GRADE_RESULT", payload: { questionId: q.id, result } });
    } catch (err) {
      showBudgetToast(err);
    }
  }, []);

  const types = QUESTION_TYPES;

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 bg-background p-4 pb-20">
      <h1 className="font-heading font-semibold text-2xl">Engine Integration Test</h1>

      <div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
        <div className="flex flex-col gap-3 p-4 px-4 group-data-[size=sm]/card:px-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input
              value={state.subject}
              onChange={(e) => dispatch({ type: "SET_SUBJECT", payload: e.target.value })}
              placeholder="Subject"
            />
            <Input
              value={state.topic}
              onChange={(e) => dispatch({ type: "SET_TOPIC", payload: e.target.value })}
              placeholder="Topic (optional)"
            />
            <Input
              type="number"
              value={state.count}
              onChange={(e) => dispatch({ type: "SET_COUNT", payload: Number(e.target.value) })}
              min={1}
              max={20}
              placeholder="Count"
            />
            <Select
              value={state.questionType}
              onValueChange={(v) => v && dispatch({ type: "SET_QUESTION_TYPE", payload: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={state.isLoading} className="w-full">
            {state.isLoading ? "Generating…" : "Generate"}
          </Button>
        </div>
      </div>

      {state.error && (
        <div className="overflow-hidden rounded-card-lg border border-border/80 border-destructive bg-card shadow-level-2 transition-colors">
          <div className="p-4 px-4 text-destructive text-sm group-data-[size=sm]/card:px-3">
            {state.error}
          </div>
        </div>
      )}

      {state.isLoading && <Skeleton className="h-48 w-full" />}

      {state.questions.length > 0 && (
        <>
          <div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
            <header className="rounded-t-[2.5rem] border-border/80 border-t p-4 pb-2">
              <h2 className="font-medium font-sans text-sm">
                Questions ({state.questions.length})
              </h2>
            </header>
            <div className="flex flex-col gap-3 p-4 px-4 pt-0 group-data-[size=sm]/card:px-3">
              {state.questions.map((q, _i) => (
                <div
                  key={q.id}
                  className="flex flex-col gap-2 p-3 px-4 group-data-[size=sm]/card:px-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {q.type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {q.difficulty}
                    </Badge>
                    <span className="text-muted-foreground text-xs">{q.points} pts</span>
                  </div>
                  <div className="text-sm">
                    <MarkdownRenderer content={q.questionText} subject={state.subject} />
                  </div>
                  <div className="line-clamp-2 text-muted-foreground text-xs">
                    Hint: {q.hint}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGrade(q)}
                        disabled={!!state.grading[q.id]}
                      >
                        {state.grading[q.id] ? `Score: ${state.grading[q.id].score}` : "Test Grade"}
                      </Button>
                      {q.steps && q.steps.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {q.steps.length} steps
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
            <header className="rounded-t-[2.5rem] border-border/80 border-t p-4 pb-2">
              <h2 className="font-medium font-sans text-sm">Raw Response</h2>
            </header>
            <div className="p-4 px-4 pt-0 group-data-[size=sm]/card:px-3">
              <Textarea value={state.rawJson} readOnly className="min-h-48 font-mono text-xs" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
