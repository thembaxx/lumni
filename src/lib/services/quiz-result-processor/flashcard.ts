import { Effect } from "effect";
import type { QuestionType } from "@/lib/question-engine/types";
import { flashcardCreateEffect, flashcardReviewEffect } from "./effects";
import type { QuizResultDeps, FlashcardItem } from "./types";

export function processFlashcardEffect(
  cards: FlashcardItem[],
  qualities: Map<string, number>,
  subject: string,
  isSm2: boolean,
  deps: QuizResultDeps,
): Effect.Effect<void> {
  return Effect.gen(function* () {
    const totalCards = cards.length;
    const passedCount = Array.from(qualities.values()).filter((q) => q >= 3).length;
    const accuracy = totalCards > 0 ? Math.round((passedCount / totalCards) * 100) : 0;
    deps.updateStreak();
    deps.addXp(totalCards, accuracy, deps.currentStreak);
    deps.checkAndUnlockAchievements(
      deps.totalQuestionsAnswered + totalCards,
      accuracy,
      deps.currentStreak,
      deps.levelInfo.level,
      accuracy === 100,
    );
    deps.checkForRewardChests();
    const cardEffects: Effect.Effect<void>[] = [];
    for (const card of cards) {
      const quality = qualities.get(card.id) ?? 0;
      const isKnown = quality >= 3;
      if (isSm2) {
        cardEffects.push(flashcardReviewEffect(deps, card.id, quality));
      } else {
        deps.trackQuestionResult({
          subjectId: subject,
          topicId: card.topic,
          bloomLevel: card.rawQuestion.bloomTaxonomy,
          score: isKnown ? 1 : 0,
          maxScore: 1,
        });
      }
      if (!isKnown) {
        deps.addWrongAnswer({
          questionId: card.id,
          questionText: card.front,
          subject,
          topic: card.topic,
          correctAnswer: card.back,
          userAnswer: "",
          explanation: card.back,
        });
        deps.addRetentionItem?.({
          questionId: card.id,
          questionText: card.front,
          subject,
          topic: card.topic,
          correctAnswer: card.back,
          explanation: card.back,
        });
        if (!isSm2) {
          cardEffects.push(flashcardCreateEffect(deps, card.front, card.back, subject, card.topic));
        }
      }
    }
    yield* Effect.all(cardEffects, { concurrency: "unbounded" });
    deps.enqueue("analytics-sync", {
      events: cards.map((card) => ({
        event: "grade",
        timestamp: Date.now(),
        subject,
        questionType: "multiple-choice" as QuestionType,
        success: (qualities.get(card.id) ?? 0) >= 3,
        duration: 0,
      })),
    });
  });
}
