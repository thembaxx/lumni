import { Query } from "appwrite";
import { COLLECTIONS, createDocument, listDocuments, updateDocument } from "@/lib/db/client";
import { enqueueGradeSideEffects } from "@/lib/orchestrator/grading";
import { QuestionEngine } from "@/lib/question-engine/question-engine";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { PushDeliveryService } from "@/lib/services/push-delivery";
import { logError } from "@/lib/shared/logger";

interface AnswerEntry {
  question: Question;
  answer: UserAnswer;
}

interface GradedAnswer {
  questionId: string;
  questionText: string;
  correct: boolean;
  score: number;
  maxScore: number;
  feedback: string;
}

interface SubmissionResult {
  score: number;
  total: number;
  correctCount: number;
  gradedAnswers: GradedAnswer[];
}

interface AssignmentSubmission {
  $id: string;
  assignmentId: string;
  studentId: string;
  score: number;
  maxScore: number;
  totalQuestions: number;
  correctCount: number;
  completedAt: string;
  gradedAnswers: string;
}

const pushService = new PushDeliveryService();

async function sendAssignmentGradedPush(
  userId: string,
  subject: string,
  score: number,
  total: number,
): Promise<void> {
  try {
    await pushService.sendToUser(userId, {
      title: "Assignment Graded",
      body: `Your ${subject} assignment received a score of ${score}/${total}`,
      url: "/dashboard",
    });
  } catch {
    // Push notification delivery is best-effort
  }
}

export class SubmissionService {
  async submit(
    assignmentId: string,
    userId: string,
    answers: Record<string, unknown>,
    subject: string,
    topic?: string,
  ): Promise<SubmissionResult> {
    const assignment = await listDocuments<{
      $id: string;
    }>(COLLECTIONS.TEACHER_ASSIGNMENTS, [Query.equal("$id", assignmentId), Query.limit(1)]);
    if (assignment.length === 0) {
      throw new Error("Assignment not found");
    }

    const engine = await QuestionEngine.initialize();

    const entries = Object.entries(answers).map(([questionId, raw]) => ({
      questionId,
      entry: raw as AnswerEntry,
    }));

    const gradingResults = await Promise.allSettled(
      entries.map(async ({ questionId, entry }) => {
        const { question, answer: userAnswer } = entry;
        if (!question || !userAnswer) {
          throw new Error("Invalid answer entry");
        }
        const result = await engine.grade(question, userAnswer);
        const bloomLevel = question.bloomTaxonomy ?? "understand";
        await enqueueGradeSideEffects({
          subject,
          topic: topic ?? "assignment",
          bloomLevel,
          questionType: question.type,
          score: result.score,
          maxScore: result.maxScore,
          correct: result.correct,
          question,
        });
        return {
          questionId,
          questionText: question.questionText,
          correct: result.correct,
          score: result.score,
          maxScore: result.maxScore,
          feedback: result.feedback,
        };
      }),
    );

    const gradedAnswers: GradedAnswer[] = [];
    let totalScore = 0;
    let totalMaxScore = 0;

    for (const [i, result] of gradingResults.entries()) {
      if (result.status === "fulfilled") {
        gradedAnswers.push(result.value);
        totalScore += result.value.score;
        totalMaxScore += result.value.maxScore;
      } else {
        const { questionId, entry } = entries[i];
        logError("SubmissionService", {
          message: "Failed to grade question",
          questionId,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
        const points = entry.question?.points ?? 0;
        gradedAnswers.push({
          questionId,
          questionText: entry.question?.questionText ?? "",
          correct: false,
          score: 0,
          maxScore: points,
          feedback: "Grading failed",
        });
        totalMaxScore += points;
      }
    }

    const correctCount = gradedAnswers.filter((g) => g.correct).length;

    const existing = await listDocuments<AssignmentSubmission>(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, [
      Query.equal("assignmentId", assignmentId),
      Query.equal("studentId", userId),
    ]);

    if (existing.length > 0) {
      await updateDocument(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, existing[0].$id, {
        score: totalScore,
        maxScore: totalMaxScore,
        totalQuestions: gradedAnswers.length,
        correctCount,
        completedAt: new Date().toISOString(),
        gradedAnswers: JSON.stringify(gradedAnswers),
      });
    } else {
      await createDocument(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, {
        assignmentId,
        studentId: userId,
        score: totalScore,
        maxScore: totalMaxScore,
        totalQuestions: gradedAnswers.length,
        correctCount,
        completedAt: new Date().toISOString(),
        gradedAnswers: JSON.stringify(gradedAnswers),
      });
    }

    await sendAssignmentGradedPush(userId, subject, totalScore, totalMaxScore);

    return {
      score: totalScore,
      total: totalMaxScore,
      correctCount,
      gradedAnswers,
    };
  }
}
