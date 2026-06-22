import {
  type QuestionRatingRepository,
  questionRatingRepository,
} from "@/lib/db/repositories/question-rating-repository";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { logError } from "@/lib/shared/logger";
import { failure, type ServiceResult, success } from "@/lib/shared/service-result";

export class QuestionRatingService {
  constructor(private repo: QuestionRatingRepository = questionRatingRepository) {}

  async rate(params: {
    questionId: string;
    subject: string;
    topic?: string;
    rating: number;
    feedback?: string;
  }): Promise<ServiceResult<void>> {
    try {
      const existing = await this.repo.findByQuestionId(params.questionId);

      const record = {
        ...params,
        rating: Math.min(5, Math.max(1, Math.round(params.rating))),
        createdAt: Date.now(),
      };

      await this.repo.upsert(existing?.id, record);

      await enqueue("appwrite-rating-sync", {
        questionId: params.questionId,
        subject: params.subject,
        rating: record.rating,
        feedback: params.feedback,
        createdAt: record.createdAt,
      });

      return success(undefined);
    } catch (e) {
      logError("QuestionRatingServiceRate", e);
      return failure(e instanceof Error ? e.message : "Failed to rate question");
    }
  }

  async getRatingsForSubject(
    subject: string,
  ): Promise<ServiceResult<import("@/lib/db/schema").QuestionRating[]>> {
    try {
      const ratings = await this.repo.getBySubject(subject);
      return success(ratings);
    } catch (e) {
      logError("QuestionRatingServiceGetRatings", e);
      return failure(e instanceof Error ? e.message : "Failed to get ratings");
    }
  }

  async getAllRatings(): Promise<ServiceResult<import("@/lib/db/schema").QuestionRating[]>> {
    try {
      const ratings = await this.repo.getAll();
      return success(ratings);
    } catch (e) {
      logError("QuestionRatingServiceGetAll", e);
      return failure(e instanceof Error ? e.message : "Failed to get ratings");
    }
  }

  async getRatingStats(): Promise<
    ServiceResult<{
      total: number;
      average: number;
      counts: Record<number, number>;
    }>
  > {
    try {
      const all = await this.repo.getAll();
      const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;

      for (const r of all) {
        counts[r.rating] = (counts[r.rating] ?? 0) + 1;
        sum += r.rating;
      }

      return success({
        total: all.length,
        average: all.length > 0 ? Math.round((sum / all.length) * 10) / 10 : 0,
        counts,
      });
    } catch (e) {
      logError("QuestionRatingServiceGetStats", e);
      return failure(e instanceof Error ? e.message : "Failed to get rating stats");
    }
  }

  async getLowRatedQuestions(
    threshold = 2,
    minRatings = 2,
  ): Promise<
    ServiceResult<
      Array<{
        questionId: string;
        subject: string;
        avgRating: number;
        count: number;
      }>
    >
  > {
    try {
      const all = await this.repo.getAll();
      const grouped = new Map<string, { ratings: number[]; subject: string }>();

      for (const r of all) {
        const existing = grouped.get(r.questionId) ?? {
          ratings: [],
          subject: r.subject,
        };
        existing.ratings.push(r.rating);
        grouped.set(r.questionId, existing);
      }

      const result: Array<{
        questionId: string;
        subject: string;
        avgRating: number;
        count: number;
      }> = [];

      for (const [questionId, data] of grouped) {
        const ratings = data.ratings;
        if (ratings.length >= minRatings) {
          const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
          if (avg <= threshold) {
            result.push({
              questionId,
              subject: data.subject,
              avgRating: Math.round(avg * 10) / 10,
              count: data.ratings.length,
            });
          }
        }
      }

      return success(result.sort((a, b) => a.avgRating - b.avgRating));
    } catch (e) {
      logError("QuestionRatingServiceGetLowRated", e);
      return failure(e instanceof Error ? e.message : "Failed to get low-rated questions");
    }
  }
}

export const questionRatingService = new QuestionRatingService();
