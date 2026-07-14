"use client";

import Home01Icon from "@hugeicons/core-free-icons/Home01Icon";
import Share08Icon from "@hugeicons/core-free-icons/Share08Icon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import UndoIcon from "@hugeicons/core-free-icons/UndoIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Confetti } from "@/components/celebration";
import { ShareResultButton } from "@/components/shared/share-button";
import { Button } from "@/components/ui/button";

interface FlashcardsResultsProps {
  totalCards: number;
  knownCount: number;
  reviewCount: number;
  subject: string;
  onGoHouse: () => void;
  onRestart: () => void;
  onShareDeck?: () => void;
}

export function FlashcardsResults({
  totalCards,
  knownCount,
  reviewCount,
  subject,
  onGoHouse,
  onRestart,
  onShareDeck,
}: FlashcardsResultsProps) {
  const t = useTranslations();
  const accuracy = totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0;
  const didWell = accuracy >= 70;

  return (
    <>
      <Confetti trigger={didWell} count={40} duration={2000} />
      <div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
        <div className="col-span-12 col-start-1 flex items-center justify-center p-4 md:col-span-7">
          <div className="mx-auto w-full max-w-md">
            <div className="flex flex-col gap-4">
              <header className="text-left">
                <h2 className="font-semibold text-xl tracking-tight">
                  {accuracy === 100
                    ? t("flashcards.perfectResult")
                    : didWell
                      ? t("flashcards.greatResult")
                      : t("flashcards.goodResult")}
                </h2>
              </header>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8 rounded-lg bg-muted p-4 sm:col-span-8">
                  <p className="font-bold text-2xl">{totalCards}</p>
                  <p className="text-muted-foreground text-xs">{t("flashcards.cardsStudied")}</p>
                </div>
                <div className="col-span-4 rounded-lg bg-success/10 p-4 sm:col-span-4">
                  <p className="font-bold text-success text-xl">{knownCount}</p>
                  <p className="text-success text-xs">{t("flashcards.nailedIt")}</p>
                </div>
                <div className="col-span-12 rounded-lg bg-warning/10 p-4 sm:col-span-4">
                  <p className="font-bold text-warning text-xl">{reviewCount}</p>
                  <p className="text-warning text-xs">{t("flashcards.stillLearning")}</p>
                </div>
                <div className="col-span-12 flex items-center gap-2">
                  <HugeiconsIcon icon={Target01Icon} className="size-4 text-success" />
                  <span className="font-medium text-sm text-success">
                    {t("flashcards.mastery", { accuracy })}
                  </span>
                </div>
                <div className="col-span-12 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={onGoHouse}>
                    <HugeiconsIcon icon={Home01Icon} className="mr-2 size-4" />
                    {t("flashcards.dashboard")}
                  </Button>
                  <Button className="flex-1" onClick={onRestart}>
                    <HugeiconsIcon icon={UndoIcon} className="mr-2 size-4" />
                    {t("flashcards.tryAgain")}
                  </Button>
                </div>
                {onShareDeck && (
                  <div className="col-span-6">
                    <Button variant="outline" className="w-full gap-2" onClick={onShareDeck}>
                      <HugeiconsIcon icon={Share08Icon} className="size-4" />
                      Share Deck
                    </Button>
                  </div>
                )}
                <div className={onShareDeck ? "col-span-6" : "col-span-12"}>
                  <ShareResultButton
                    cardParams={{
                      score: knownCount,
                      total: totalCards,
                      percentage: accuracy,
                      title: t("flashcards.resultHeading", { subject }),
                      subtitle: t("flashcards.masteredCount", {
                        knownCount,
                        totalCards,
                      }),
                      type: "flashcard",
                    }}
                    text={t("flashcards.shareText", { accuracy, subject })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
          <div className="absolute inset-0 bg-linear-to-br from-success/10 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-success/10 blur-2xl" />
          </div>
        </div>
      </div>
    </>
  );
}
