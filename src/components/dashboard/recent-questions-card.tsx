"use client";

import { useEffect, useReducer } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { useRouter } from "@/i18n/navigation";
import { logError } from "@/lib/shared/logger";

type State = { entries: WrongAnswerEntry[]; loading: boolean };
type Action = { type: "loaded"; entries: WrongAnswerEntry[] } | { type: "error" };

const initialState: State = { entries: [], loading: true };

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case "loaded":
      return { entries: action.entries, loading: false };
    case "error":
      return { entries: [], loading: false };
  }
}

export function RecentQuestionsCard() {
  const { getWrongAnswers } = useWrongAnswerJournal();
  const { push } = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    getWrongAnswers(undefined, undefined, 5)
      .then((data) => dispatch({ type: "loaded", entries: data }))
      .catch((err) => {
        logError("RecentQuestionsCard", err);
        dispatch({ type: "error" });
      });
  }, [getWrongAnswers]);

  if (state.entries.length === 0 && !state.loading) return null;

  if (state.loading) {
    return (
      <Card className="overflow-hidden rounded-3xl shadow-level-1">
        <CardHeader>
          <CardTitle className="font-extrabold text-lg">Recent Questions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-5 pt-0">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
            <div key={i} className="rounded-2xl border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="card-entrance">
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="font-extrabold text-lg">Recent Questions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-5 pt-0">
          {state.entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border bg-card p-4 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-[--system-accent]/10 px-2 py-0.5 font-medium text-(--fs-caption-3) text-muted-foreground uppercase tracking-wide">
                  {entry.subject}
                </span>
                {entry.topic && (
                  <span className="text-(--fs-caption-3) text-muted-foreground">{entry.topic}</span>
                )}
              </div>
              <div className="line-clamp-2 leading-relaxed">
                <MarkdownRenderer content={entry.questionText} />
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => push("/review")}
            className="self-start text-xs"
          >
            Review all
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
