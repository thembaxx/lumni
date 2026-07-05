"use client";

import { useCallback, useMemo, useState } from "react";
import type { VocabularyEntry } from "@/lib/vocabulary/service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface VocabularyQuizProps {
  words: VocabularyEntry[];
  onComplete?: (score: number, total: number) => void;
}

export function VocabularyQuiz({ words, onComplete }: VocabularyQuizProps) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const shuffled = useMemo(() => {
    const opts = words.map((w) => ({
      word: w.word,
      definition: w.definition,
      options: [w.word, ...words.filter((x) => x.word !== w.word).map((x) => x.word)]
        .toSorted(() => Math.random() - 0.5)
        .slice(0, 4),
    }));
    return opts.toSorted(() => Math.random() - 0.5);
  }, [words]);

  const question = shuffled[current];
  if (!question) return null;

  const handleSelect = useCallback(
    (word: string) => {
      setSelected(word);
      if (word === question.word) {
        setScore((s) => s + 1);
      }
      setTimeout(() => {
        if (current < shuffled.length - 1) {
          setCurrent((c) => c + 1);
          setSelected(null);
        } else {
          setShowResult(true);
          onComplete?.(score + (word === question.word ? 1 : 0), shuffled.length);
        }
      }, 800);
    },
    [current, question, shuffled.length, score, onComplete],
  );

  if (showResult) {
    return (
      <Card className="rounded-card shadow-level-1">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <span className="font-bold text-primary text-2xl">
              {Math.round((score / shuffled.length) * 100)}%
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-lg">
              {score} / {shuffled.length} correct
            </p>
            <p className="text-muted-foreground text-sm">
              {score === shuffled.length
                ? "Perfect! You know all these words."
                : score >= shuffled.length / 2
                  ? "Good effort! Keep reviewing."
                  : "Keep practicing with these words."}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setCurrent(0);
              setScore(0);
              setShowResult(false);
              setSelected(null);
            }}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          {current + 1} / {shuffled.length}
        </span>
        <Progress value={((current + 1) / shuffled.length) * 100} className="h-1 w-24" />
      </div>

      <Card className="rounded-card shadow-level-1">
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              What word matches this definition?
            </span>
            <p className="text-balance font-medium text-lg leading-relaxed">
              {question.definition}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {question.options.map((opt) => {
              const isCorrect = opt === question.word;
              const isSelected = opt === selected;
              let variant: "outline" | "default" | "secondary" = "outline";
              if (isSelected && isCorrect) variant = "default";
              else if (isSelected && !isCorrect) variant = "secondary";
              return (
                <Button
                  key={opt}
                  variant={variant}
                  className="h-auto rounded-xl py-3 text-sm"
                  disabled={selected !== null}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
