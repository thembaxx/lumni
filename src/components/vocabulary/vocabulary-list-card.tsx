"use client";

import Bookmark02Icon from "@hugeicons/core-free-icons/Bookmark02Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/shared/fade-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useAuth } from "@/lib/auth/auth-context";
import { getSavedWords } from "@/lib/vocabulary/service";

export function VocabularyListCard() {
  const { user } = useAuth();
  const { push } = useNavigationDirection();
  const userId = user?.$id ?? "anonymous";

  const { data: words } = useQuery({
    queryKey: ["vocabulary-list", userId],
    queryFn: () => getSavedWords(userId),
    enabled: userId !== "anonymous",
  });

  const hasWords = words && words.length > 0;

  return (
    <Card className="overflow-hidden rounded-3xl shadow-level-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-extrabold text-lg">Saved Vocabulary</CardTitle>
          <HugeiconsIcon icon={Bookmark02Icon} className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-5 pt-0">
        {hasWords ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {words.length} word{words.length !== 1 ? "s" : ""} saved
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => push("/flashcards?mode=vocabulary")}
              >
                Review
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {words
                .slice(-5)
                .toReversed()
                .map((word) => (
                  <FadeIn
                    key={word.id}
                    direction="up"
                    distance={4}
                    className="flex items-center justify-between rounded-2xl border bg-card px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={BookOpen01Icon}
                        className="size-3.5 text-muted-foreground"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{word.word}</span>
                        <span className="line-clamp-1 text-(--fs-caption-3) text-muted-foreground">
                          {word.definition}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-(--fs-caption-3) text-muted-foreground">
                      {word.language}
                    </span>
                  </FadeIn>
                ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <HugeiconsIcon icon={Bookmark02Icon} className="size-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              Save words from lessons and stories to review them here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
