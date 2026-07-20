import { formatCorrectAnswer } from "@/lib/question-engine/answer-formatter";
import type { QuestionType } from "@/lib/question-engine/types";
import { getCorrectAnswerText } from "./effects";
import type {
  BoltResult,
  ExamPartResult,
  FlashcardItem,
  QuizResults,
  HandlerResult,
} from "./types";

export function handleBolt(result: BoltResult): HandlerResult {
  const { question, correct } = result;
  const accuracy = correct ? 100 : 0;
  const wrongItems: HandlerResult["wrongItems"] = [];
  const retentionItems: HandlerResult["retentionItems"] = [];
  const flashcardItems: HandlerResult["flashcardItems"] = [];
  const trackItems: HandlerResult["trackItems"] = [];

  trackItems.push({
    subjectId: question.subject,
    topicId: question.topic,
    bloomLevel: question.bloomTaxonomy,
    score: correct ? 1 : 0,
    maxScore: 1,
  });

  if (!correct) {
    const correctAnswer = formatCorrectAnswer(question);
    wrongItems.push({
      questionId: question.id,
      questionText: question.questionText,
      subject: question.subject,
      topic: question.topic,
      correctAnswer,
      userAnswer: "(see quiz history)",
      explanation: question.explanation,
    });
    retentionItems.push({
      questionId: question.id,
      questionText: question.questionText,
      subject: question.subject,
      topic: question.topic,
      correctAnswer,
      explanation: question.explanation,
    });
    flashcardItems.push({
      front: question.questionText,
      back: correctAnswer,
      subject: question.subject,
      topic: question.topic,
    });
  }

  return {
    accuracy,
    totalCount: 1,
    wrongCount: wrongItems.length,
    perfectQuiz: correct,
    trackItems,
    wrongItems,
    retentionItems,
    flashcardItems,
    flashcardReviews: [],
    events: [
      {
        event: "grade",
        timestamp: Date.now(),
        subject: question.subject,
        questionType: question.type,
        success: correct,
        duration: 0,
      },
    ],
    shouldMarkPlanStale: false,
  };
}

export function handleQuiz(results: QuizResults): HandlerResult {
  const accuracy =
    results.totalQuestions > 0
      ? Math.round((results.correctAnswers / results.totalQuestions) * 100)
      : 0;
  const wrongItems: HandlerResult["wrongItems"] = [];
  const retentionItems: HandlerResult["retentionItems"] = [];
  const flashcardItems: HandlerResult["flashcardItems"] = [];
  const trackItems: HandlerResult["trackItems"] = [];
  const events: HandlerResult["events"] = [];

  for (const [i, question] of results.questions.entries()) {
    const correct = results.correctness[i] ?? false;
    trackItems.push({
      subjectId: question.subject,
      topicId: question.topic,
      bloomLevel: question.bloomTaxonomy,
      score: correct ? 1 : 0,
      maxScore: 1,
    });
    events.push({
      event: "grade",
      timestamp: Date.now(),
      subject: question.subject,
      questionType: question.type,
      success: correct,
      duration: 0,
    });
    if (!correct) {
      const correctAnswer = formatCorrectAnswer(question);
      wrongItems.push({
        questionId: question.id,
        questionText: question.questionText,
        subject: question.subject,
        topic: question.topic,
        correctAnswer,
        userAnswer: "(see quiz history)",
        explanation: question.explanation,
      });
      retentionItems.push({
        questionId: question.id,
        questionText: question.questionText,
        subject: question.subject,
        topic: question.topic,
        correctAnswer,
        explanation: question.explanation,
      });
      flashcardItems.push({
        front: question.questionText,
        back: correctAnswer,
        subject: question.subject,
        topic: question.topic,
      });
    }
  }

  return {
    accuracy,
    totalCount: results.totalQuestions,
    wrongCount: wrongItems.length,
    perfectQuiz: accuracy === 100,
    trackItems,
    wrongItems,
    retentionItems,
    flashcardItems,
    flashcardReviews: [],
    events,
    shouldMarkPlanStale: true,
  };
}

export function handleExam(
  parts: ExamPartResult[],
  subject: string,
  paperId: string | undefined,
): HandlerResult {
  const correctCount = parts.filter((r) => r.correct).length;
  const totalCount = parts.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const wrongItems: HandlerResult["wrongItems"] = [];
  const retentionItems: HandlerResult["retentionItems"] = [];
  const flashcardItems: HandlerResult["flashcardItems"] = [];
  const trackItems: HandlerResult["trackItems"] = [];
  const events: HandlerResult["events"] = [];

  for (const result of parts) {
    const topic = result.sectionId;
    const maxScore = typeof result.part.marks === "number" ? result.part.marks : result.score;
    trackItems.push({
      subjectId: subject,
      topicId: topic,
      bloomLevel: "apply",
      score: result.score,
      maxScore,
      paperId,
    });
    events.push({
      event: "grade",
      timestamp: Date.now(),
      subject,
      questionType: "multiple-choice" as QuestionType,
      success: result.correct,
      duration: 0,
    });
    if (!result.correct) {
      const partText = result.part.text ?? `Question ${result.questionId}`;
      const correctAnswer = result.correctAnswerText ?? getCorrectAnswerText(result.part);
      wrongItems.push({
        questionId: result.partId,
        questionText: partText,
        subject,
        topic,
        correctAnswer,
        userAnswer: result.userAnswer ?? "",
        explanation: "",
      });
      retentionItems.push({
        questionId: result.partId,
        questionText: partText,
        subject,
        topic,
        correctAnswer,
        explanation: "",
      });
      flashcardItems.push({
        front: partText,
        back: getCorrectAnswerText(result.part) || "Review this topic",
        subject,
      });
    }
  }

  return {
    accuracy,
    totalCount,
    wrongCount: wrongItems.length,
    perfectQuiz: accuracy === 100,
    trackItems,
    wrongItems,
    retentionItems,
    flashcardItems,
    flashcardReviews: [],
    events,
    shouldMarkPlanStale: true,
  };
}

export function handleFlashcard(
  cards: FlashcardItem[],
  qualities: Map<string, number>,
  subject: string,
  isSm2: boolean,
): HandlerResult {
  const totalCards = cards.length;
  const passedCount = Array.from(qualities.values()).filter((q) => q >= 3).length;
  const accuracy = totalCards > 0 ? Math.round((passedCount / totalCards) * 100) : 0;
  const wrongItems: HandlerResult["wrongItems"] = [];
  const retentionItems: HandlerResult["retentionItems"] = [];
  const flashcardItems: HandlerResult["flashcardItems"] = [];
  const flashcardReviews: HandlerResult["flashcardReviews"] = [];
  const trackItems: HandlerResult["trackItems"] = [];
  const events: HandlerResult["events"] = [];

  for (const card of cards) {
    const quality = qualities.get(card.id) ?? 0;
    const isKnown = quality >= 3;
    events.push({
      event: "grade",
      timestamp: Date.now(),
      subject,
      questionType: "multiple-choice" as QuestionType,
      success: isKnown,
      duration: 0,
    });
    if (isSm2) {
      flashcardReviews.push({ id: card.id, quality });
    } else {
      trackItems.push({
        subjectId: subject,
        topicId: card.topic,
        bloomLevel: card.rawQuestion.bloomTaxonomy,
        score: isKnown ? 1 : 0,
        maxScore: 1,
      });
    }
    if (!isKnown) {
      wrongItems.push({
        questionId: card.id,
        questionText: card.front,
        subject,
        topic: card.topic,
        correctAnswer: card.back,
        userAnswer: "",
        explanation: card.back,
      });
      retentionItems.push({
        questionId: card.id,
        questionText: card.front,
        subject,
        topic: card.topic,
        correctAnswer: card.back,
        explanation: card.back,
      });
      if (!isSm2) {
        flashcardItems.push({
          front: card.front,
          back: card.back,
          subject,
          topic: card.topic,
        });
      }
    }
  }

  return {
    accuracy,
    totalCount: totalCards,
    wrongCount: wrongItems.length,
    perfectQuiz: accuracy === 100,
    trackItems,
    wrongItems,
    retentionItems,
    flashcardItems,
    flashcardReviews,
    events,
    shouldMarkPlanStale: false,
  };
}
