"use client";

import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FlashcardsEmptyProps {
  subject: string;
  onGoBack: () => void;
  mode?: "ai" | "mistakes" | "vocabulary";
}

export function FlashcardsEmpty({ subject, onGoBack, mode }: FlashcardsEmptyProps) {
  const t = useTranslations();
  const message =
    mode === "mistakes"
      ? t("flashcards.noMistakes", { subject })
      : t("flashcards.uploadPrompt", { subject });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{t("flashcards.deckEmpty")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <div>
                  <HugeiconsIcon
                    icon={Search01Icon}
                    className="mx-auto size-10 text-muted-foreground"
                  />
                </div>
              </EmptyMedia>
              <EmptyTitle>{t("flashcards.noFlashcards")}</EmptyTitle>
              <EmptyDescription>{message}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" className="w-full" onClick={onGoBack}>
                {t("flashcards.goBack")}
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
