"use client";

import { useQuery } from "@tanstack/react-query";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { useRouter } from "@/i18n/navigation";

export function RecentQuestionsCard() {
  const { getWrongAnswers } = useWrongAnswerJournal();
  const { push } = useRouter();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["recent-questions"],
    queryFn: () => getWrongAnswers(undefined, undefined, 5),
    staleTime: 30_000,
  });

  if (entries.length === 0 && !isLoading) return null;

  if (isLoading) {
    return (
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="font-bold text-lg">Recent Questions</CardTitle>
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
          <CardTitle className="font-bold text-lg">Recent Questions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-5 pt-0">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border bg-card p-4 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-(--system-accent)/10 text-muted-foreground uppercase tracking-wide"
                >
                  {entry.subject}
                </Badge>
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
