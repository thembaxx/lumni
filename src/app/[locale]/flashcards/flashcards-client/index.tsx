"use client";

import { useTranslations } from "next-intl";
import { Confetti, GamificationCelebration, XPGainPopup } from "@/components/celebration";
import { PageContainer } from "@/components/layout/page-container";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
import { useFlashcardSession } from "@/hooks/use-flashcard-session";
import { FlashcardsActive } from "../flashcards-active";
import { FlashcardsEmpty } from "../flashcards-empty";
import { FlashcardsIdle } from "../flashcards-idle";
import { FlashcardsLoading } from "../flashcards-loading";
import { FlashcardsResults } from "../flashcards-results";

export function FlashcardsClient() {
  const t = useTranslations();

  const {
    session,
    displayCards,
    totalCards,
    knownCount,
    reviewCount,
    showConfetti,
    showXPGain,
    isLoading,
    handleReview,
    handleSessionComplete,
    handleRestart,
    stopSession,
    startSession,
    handleShareDeck,
  } = useFlashcardSession();

  if (!session.isActive) {
    return (
      <div className="min-h-dvh bg-system-grouped pt-4">
        <AmbientGradient />
        <PageContainer className="flex flex-col gap-6">
          <LocalDataNotice page="flashcards" description={t("flashcards.localDataNotice")} />
          <FlashcardsIdle
            onSelect={(subject) => startSession(subject, "ai")}
            onReviewMistakes={(subject) => startSession(subject, "mistakes")}
            onReviewVocabulary={(subject) => startSession(subject, "vocabulary")}
          />
        </PageContainer>
      </div>
    );
  }

  if (isLoading && session.source === "ai") {
    return (
      <div className="min-h-dvh bg-system-grouped pt-4">
        <AmbientGradient />
        <PageContainer className="flex flex-col gap-6">
          <FlashcardsLoading />
        </PageContainer>
      </div>
    );
  }

  if (displayCards.length === 0) {
    return (
      <div className="min-h-dvh bg-system-grouped pt-4">
        <AmbientGradient />
        <PageContainer className="flex flex-col gap-6">
          <FlashcardsEmpty
            subject={session.selectedSubject}
            onGoBack={stopSession}
            mode={session.source}
          />
        </PageContainer>
      </div>
    );
  }

  if (session.sessionComplete) {
    return (
      <div className="min-h-dvh bg-system-grouped pt-4">
        <AmbientGradient />
        <PageContainer className="flex flex-col gap-6">
          <FlashcardsResults
            totalCards={totalCards}
            knownCount={knownCount}
            reviewCount={reviewCount}
            subject={session.selectedSubject || "Flashcards"}
            onGoHouse={stopSession}
            onRestart={handleRestart}
            onShareDeck={handleShareDeck}
          />
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient />
      <PageContainer className="flex flex-col gap-6">
        <GamificationCelebration />
        <Confetti trigger={showConfetti} count={20} duration={1200} />
        <XPGainPopup amount={10} visible={showXPGain} />
        <FlashcardsActive
          cards={displayCards}
          knownCount={knownCount}
          reviewCount={reviewCount}
          onReview={handleReview}
          onComplete={handleSessionComplete}
          onQuit={stopSession}
        />
      </PageContainer>
    </div>
  );
}
