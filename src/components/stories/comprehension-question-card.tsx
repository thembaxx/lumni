"use client";

import { FadeIn } from "@/components/shared/fade-in";
import { useCallback, useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fuzzyMatch } from "./helpers";
import { ComprehensionMcq } from "./comprehension-mcq";
import { ComprehensionBlank } from "./comprehension-blank";
import { ComprehensionMatching } from "./comprehension-matching";
import { ComprehensionFeedback } from "./comprehension-feedback";

export interface ComprehensionQuestion {
  id: string;
  questionText: string;
  questionType: "mcq" | "short-answer" | "fill-in-blank" | "true-false" | "matching";
  options?: string[];
  correctAnswer: string;
  explanation: string;
  sentenceTemplate?: string;
  pairs?: { left: string; right: string }[];
}

interface ComprehensionQuestionCardProps {
  question: ComprehensionQuestion;
  questionNumber: number;
  onGraded?: (score: number) => void;
}

export function ComprehensionQuestionCard({
  question,
  questionNumber,
  onGraded,
}: ComprehensionQuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [selectedLeftIdx, setSelectedLeftIdx] = useState<number | null>(null);
  const [userPairs, setUserPairs] = useState<Map<number, number>>(new Map());
  const [isGraded, setIsGraded] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  const canSubmit = useMemo(() => {
    switch (question.questionType) {
      case "mcq":
      case "true-false":
        return selectedOption !== null;
      case "short-answer":
      case "fill-in-blank":
        return textInput.trim().length > 0;
      case "matching":
        return userPairs.size > 0;
      default:
        return false;
    }
  }, [question.questionType, selectedOption, textInput, userPairs]);

  const handleSubmit = useCallback(() => {
    let correct = false;
    let s = 0;

    switch (question.questionType) {
      case "mcq":
      case "true-false": {
        if (!selectedOption) return;
        correct = selectedOption === question.correctAnswer;
        s = correct ? 100 : 0;
        break;
      }
      case "short-answer":
      case "fill-in-blank": {
        const text = textInput.trim();
        if (!text) return;
        correct = fuzzyMatch(text, [question.correctAnswer]);
        s = correct ? 100 : 0;
        break;
      }
      case "matching": {
        const correctPairs = question.pairs ?? [];
        if (correctPairs.length === 0) {
          correct = true;
          s = 100;
          break;
        }
        const leftItems = correctPairs.map((p) => p.left);
        const rightItems = correctPairs.map((p) => p.right);
        let correctCount = 0;
        for (const [leftIdx, rightIdx] of userPairs) {
          const l = leftItems[leftIdx];
          const r = rightItems[rightIdx];
          if (correctPairs.some((p) => p.left === l && p.right === r)) {
            correctCount++;
          }
        }
        s = Math.round((correctCount / correctPairs.length) * 100);
        correct = s === 100;
        break;
      }
    }

    setIsCorrect(correct);
    setScore(s);
    setIsGraded(true);
    onGraded?.(s);
  }, [question, selectedOption, textInput, userPairs, onGraded]);

  const handleLeftClick = useCallback(
    (idx: number) => {
      if (isGraded) return;
      if (userPairs.has(idx)) {
        const next = new Map(userPairs);
        next.delete(idx);
        setUserPairs(next);
      } else {
        setSelectedLeftIdx(idx);
      }
    },
    [isGraded, userPairs],
  );

  const handleRightClick = useCallback(
    (idx: number) => {
      if (isGraded || selectedLeftIdx === null) return;
      const next = new Map(userPairs);
      next.set(selectedLeftIdx, idx);
      setUserPairs(next);
      setSelectedLeftIdx(null);
    },
    [isGraded, selectedLeftIdx, userPairs],
  );

  return (
    <FadeIn direction="up" distance={12} duration={0.3}>
      <Card
        className={cn(
          "overflow-hidden rounded-2xl border shadow-sm transition-[border-color] duration-300",
          isGraded &&
            (isCorrect
              ? "border-success/30 bg-success/5"
              : "border-destructive/30 bg-destructive/5"),
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <span className="text flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-xs tabular-nums">
              {questionNumber}
            </span>
            <CardTitle className="font-semibold text-sm leading-relaxed">
              <MarkdownRenderer content={question.questionText} />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-5 pt-0 pb-5">
          {(() => {
            switch (question.questionType) {
              case "mcq":
              case "true-false":
                return (
                  <ComprehensionMcq
                    questionType={question.questionType}
                    options={question.options ?? []}
                    correctAnswer={question.correctAnswer}
                    selectedOption={selectedOption}
                    isGraded={isGraded}
                    onSelect={setSelectedOption}
                  />
                );

              case "short-answer":
                return (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      disabled={isGraded}
                      placeholder="Type your answer..."
                      className="min-h-20 resize-none rounded-xl text-base"
                      aria-label={`Answer for question ${questionNumber}`}
                    />
                  </div>
                );

              case "fill-in-blank":
                return (
                  <ComprehensionBlank
                    sentenceTemplate={question.sentenceTemplate}
                    value={textInput}
                    disabled={isGraded}
                    questionNumber={questionNumber}
                    onChange={setTextInput}
                  />
                );

              case "matching":
                return (
                  <ComprehensionMatching
                    pairs={question.pairs ?? []}
                    userPairs={userPairs}
                    selectedLeftIdx={selectedLeftIdx}
                    isGraded={isGraded}
                    onLeftClick={handleLeftClick}
                    onRightClick={handleRightClick}
                    onRemovePair={(leftIdx) => {
                      const next = new Map(userPairs);
                      next.delete(leftIdx);
                      setUserPairs(next);
                    }}
                  />
                );

              default:
                return null;
            }
          })()}

          {!isGraded && (
            <Button
              size="sm"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="self-start rounded-full"
            >
              Submit Answer
            </Button>
          )}

          {isGraded && (
            <ComprehensionFeedback
              isCorrect={isCorrect}
              score={score}
              explanation={question.explanation}
              questionType={question.questionType}
              correctAnswer={question.correctAnswer}
            />
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
