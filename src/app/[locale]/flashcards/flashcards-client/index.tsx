"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Confetti, GamificationCelebration, XPGainPopup } from "@/components/celebration";
import { PageContainer } from "@/components/layout/page-container";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
import { useTrackFlashcardEvents } from "@/hooks/use-analytics-tracking";
import { useGamification } from "@/hooks/use-gamification";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { toast } from "@/hooks/use-toast";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { useAuth } from "@/lib/auth/auth-context";
import { competencyService } from "@/lib/competency-engine/competency-service";
import { dexieDataAccess } from "@/lib/db";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { logError } from "@/lib/shared/logger";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { trackQuestionResult } from "@/lib/orchestrator/track-result";
import type { Question } from "@/lib/question-engine/types";
import { processQuizResult, type QuizResultDeps } from "@/lib/services/quiz-result-processor";
import { FlashcardsActive } from "../flashcards-active";
import { FlashcardsEmpty } from "../flashcards-empty";
import { FlashcardsIdle } from "../flashcards-idle";
import { FlashcardsLoading } from "../flashcards-loading";
import { FlashcardsResults } from "../flashcards-results";
import {
  initialCardsState,
  initialSessionState,
  sessionReducer,
  cardsReducer,
} from "./session-state";
import { computeConsecutiveCorrect, isSm2Session } from "./session-results";
import { shareFlashcardSession } from "./share-deck";
import type { FlashcardItem, FlashcardSource } from "./types";

export function FlashcardsClient() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const autoMode = searchParams.get("mode") as FlashcardSource | null;
  useEffect(() => {
    void enqueue("appwrite-flashcard-pull", {}).catch((e) => {
      logError("flashcard-pull", e);
      toast({
        type: "warning",
        message: "Could not sync flashcards from cloud",
      });
    });
  }, []);

  const [session, dispatchSession] = useReducer(sessionReducer, initialSessionState);
  const [cards, dispatchCards] = useReducer(cardsReducer, initialCardsState);
  const hasSm2Ref = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPGain, setShowXPGain] = useState(false);

  const gamification = useGamification();
  const { addWrongAnswer, getWrongAnswers } = useWrongAnswerJournal();
  const { trackFlashcardReview } = useTrackFlashcardEvents();

  const quizResultDeps: QuizResultDeps = useMemo(
    () => ({
      updateStreak: gamification.updateStreak,
      addXp: gamification.addXp,
      checkAndUnlockAchievements: gamification.checkAndUnlockAchievements,
      checkForRewardChests: gamification.checkForRewardChests,
      addWrongAnswer,
      addRetentionItem: (entry) => {
        dexieDataAccess.retentionRecurrence
          .add({
            questionId: entry.questionId,
            subject: entry.subject,
            topic: entry.topic,
            questionText: entry.questionText,
            correctAnswer: entry.correctAnswer,
            explanation: entry.explanation,
            scheduledAt: Date.now() + 24 * 60 * 60 * 1000,
            completed: false,
          })
          .catch((err) => logError("FlashcardsClient.retention", err));
      },
      flashcardEngine,
      trackQuestionResult,
      enqueue,
      addStudySession: () => {},
      markPlanStale: () => {},
      currentStreak: gamification.currentStreak,
      totalQuestionsAnswered: gamification.totalQuestionsAnswered,
      levelInfo: gamification.levelInfo,
    }),
    [
      gamification.updateStreak,
      gamification.addXp,
      gamification.checkAndUnlockAchievements,
      gamification.checkForRewardChests,
      gamification.currentStreak,
      gamification.totalQuestionsAnswered,
      gamification.levelInfo,
      addWrongAnswer,
    ],
  );

  const knownCount = Array.from(cards.qualityMap.values()).filter((q) => q >= 3).length;
  const reviewCount = cards.qualityMap.size - knownCount;

  const consecutiveCorrectRef = useRef(0);

  const processSessionResults = useCallback(
    async (sessionCards: FlashcardItem[], qualities: Map<string, number>, subject: string) => {
      const sm2Session = isSm2Session(sessionCards);
      consecutiveCorrectRef.current = computeConsecutiveCorrect(qualities, sessionCards.length);

      gamification.setCounter("consecutiveCorrectFlashcards", consecutiveCorrectRef.current);

      await processQuizResult(
        {
          source: "flashcard",
          cards: sessionCards,
          qualities,
          subject,
          isSm2: sm2Session,
        },
        quizResultDeps,
      );
    },
    [quizResultDeps, gamification],
  );

  const engineParams = useMemo(
    () => ({
      subject: session.selectedSubject.toLowerCase(),
      count: 20,
      questionType: "multiple-choice" as const,
    }),
    [session.selectedSubject],
  );

  const { questions, isLoading } = useQuestionEngine(engineParams, {
    enabled:
      session.isActive &&
      !!session.selectedSubject &&
      session.source === "ai" &&
      !hasSm2Ref.current,
  });

  const generatedCards: FlashcardItem[] =
    isLoading === false && questions?.length
      ? questions.reduce<FlashcardItem[]>((acc, q) => {
          if (!q?.id) return acc;
          acc.push({
            id: q.id,
            front: q.questionText,
            back: q.explanation,
            topic: q.topic,
            difficulty: q.difficulty,
            hint: q.hint,
            rawQuestion: q,
          });
          return acc;
        }, [])
      : [];

  const sm2Available =
    (session.source === "ai" || session.source === "vocabulary") && cards.sm2Cards.length > 0;
  const displayCards = sm2Available
    ? cards.sm2Cards
    : session.source === "mistakes"
      ? cards.mistakeCards
      : generatedCards;
  const totalCards = displayCards.length;
  const { user } = useAuth();

  const handleShareDeck = useCallback(async () => {
    const url = await shareFlashcardSession(
      displayCards,
      session.selectedSubject,
      user?.$id ?? "anonymous",
    );
    await navigator.clipboard.writeText(url);
    toast({ type: "success", message: "Deck link copied to clipboard!" });
  }, [displayCards, session.selectedSubject, user?.$id]);

  const startSession = useCallback(
    async (subject: string, src: FlashcardSource = "ai") => {
      dispatchSession({
        type: "START_SESSION",
        payload: { subject, source: src },
      });
      dispatchCards({ type: "RESET" });

      if (src === "mistakes") {
        const wrongAnswers = await getWrongAnswers(subject.toLowerCase());
        dispatchCards({
          type: "SET_MISTAKE_CARDS",
          payload: wrongAnswers.map((wa) => ({
            id: wa.questionId,
            front: wa.questionText,
            back: wa.correctAnswer || wa.explanation,
            topic: wa.topic,
            difficulty: "Medium",
            hint: wa.explanation,
            rawQuestion: {
              id: wa.questionId,
              questionText: wa.questionText,
              explanation: wa.explanation,
              subject: wa.subject,
              topic: wa.topic,
              type: "short-answer",
              difficulty: "Medium",
              bloomTaxonomy: "understand",
              points: 1,
              body: { modelAnswer: wa.correctAnswer || wa.explanation },
            } as Question,
          })),
        });
      } else if (src === "vocabulary") {
        const sm2Due = await flashcardEngine.getDueCards(subject.toLowerCase());
        const sm2New = await flashcardEngine.getNewCards(subject.toLowerCase(), 10);
        const allVocab = [...sm2Due, ...sm2New].filter((c) => c.topic === "vocabulary");
        hasSm2Ref.current = allVocab.length > 0;
        if (allVocab.length > 0) {
          dispatchCards({
            type: "SET_SM2_CARDS",
            payload: allVocab.map((c) => ({
              id: c.id,
              front: c.front,
              back: c.back,
              topic: c.topic ?? subject,
              difficulty: "Medium",
              rawQuestion: {
                id: c.id,
                questionText: c.front,
                explanation: c.back,
                subject: c.subject,
                topic: c.topic ?? subject,
                type: "short-answer",
                difficulty: "Medium",
                bloomTaxonomy: "understand",
                points: 1,
                body: { modelAnswer: c.back },
              } as Question,
            })),
          });
        }
      } else {
        const sm2Due = await flashcardEngine.getDueCards(subject.toLowerCase());
        const sm2New = await flashcardEngine.getNewCards(subject.toLowerCase(), 10);
        const allSm2 = [...sm2Due, ...sm2New];
        hasSm2Ref.current = allSm2.length > 0;
        if (allSm2.length > 0) {
          try {
            const competencies = await competencyService.getCompetencies(subject.toLowerCase());
            const topicScores = new Map<string, number>();
            for (const c of competencies) {
              const cur = topicScores.get(c.topicId) ?? 0;
              topicScores.set(c.topicId, cur + c.score);
            }
            for (const [topicId, total] of topicScores) {
              const count = competencies.filter((c) => c.topicId === topicId).length;
              topicScores.set(topicId, count > 0 ? total / count : 0);
            }
            allSm2.sort((a, b) => {
              const aScore = topicScores.get(a.topic ?? "") ?? 100;
              const bScore = topicScores.get(b.topic ?? "") ?? 100;
              if (aScore !== bScore) return aScore - bScore;
              return (a.nextReview ?? 0) - (b.nextReview ?? 0);
            });
          } catch {
            // Fall back to default ordering
          }
          dispatchCards({
            type: "SET_SM2_CARDS",
            payload: allSm2.map((c) => ({
              id: c.id,
              front: c.front,
              back: c.back,
              topic: c.topic ?? subject,
              difficulty: "Medium",
              rawQuestion: {
                id: c.id,
                questionText: c.front,
                explanation: c.back,
                subject: c.subject,
                topic: c.topic ?? subject,
                type: "short-answer",
                difficulty: "Medium",
                bloomTaxonomy: "understand",
                points: 1,
                body: { modelAnswer: c.back },
              } as Question,
            })),
          });
        }
      }
    },
    [getWrongAnswers],
  );

  useEffect(() => {
    if (autoMode && !session.isActive) {
      startSession("vocabulary", autoMode);
    }
  }, [autoMode, session.isActive, startSession]);

  const stopSession = useCallback(() => {
    dispatchSession({ type: "STOP_SESSION" });
  }, []);

  const handleReview = useCallback(
    (cardId: string, quality: number) => {
      dispatchCards({ type: "SET_QUALITY", payload: { cardId, quality } });
      trackFlashcardReview(session.selectedSubject, quality);
      if (quality >= 3) {
        setShowConfetti(true);
        setShowXPGain(true);
        setTimeout(() => setShowConfetti(false), 1500);
        setTimeout(() => setShowXPGain(false), 1000);
      }
      if (quality < 3) {
        const card = displayCards.find((c) => c.id === cardId);
        if (card) {
          dexieDataAccess.retentionRecurrence
            .add({
              questionId: cardId,
              subject: session.selectedSubject,
              topic: card.topic,
              questionText: card.front,
              correctAnswer: card.back,
              explanation: card.hint ?? "",
              scheduledAt: Date.now() + 24 * 60 * 60 * 1000,
              completed: false,
            })
            .catch((err) => logError("FlashcardsClient.wrongAnswerReview", err));
        }
      }
    },
    [session.selectedSubject, trackFlashcardReview, displayCards],
  );

  const handleSessionComplete = useCallback(() => {
    dispatchSession({ type: "COMPLETE_SESSION" });
    processSessionResults(
      displayCards,
      cards.qualityMap,
      session.selectedSubject.toLowerCase(),
    ).catch((e) => {
      logError("flashcard-session-processing", e);
      toast({
        type: "error",
        message: "Session results may not be fully saved.",
      });
    });
  }, [displayCards, cards.qualityMap, session.selectedSubject, processSessionResults]);

  const handleRestart = useCallback(() => {
    dispatchCards({ type: "RESET" });
    dispatchSession({ type: "RESTART" });
  }, []);

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
