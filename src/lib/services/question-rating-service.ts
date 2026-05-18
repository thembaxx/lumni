import { addToSyncQueue } from "@/lib/db/offline";
import { offlineDB, type QuestionRating } from "@/lib/db/schema";

export class QuestionRatingService {
	async rate(params: {
		questionId: string;
		subject: string;
		topic?: string;
		rating: number;
		feedback?: string;
	}): Promise<void> {
		const existing = await offlineDB.questionRatings
			.where("questionId")
			.equals(params.questionId)
			.first();

		const record = {
			...params,
			rating: Math.min(5, Math.max(1, Math.round(params.rating))),
			createdAt: Date.now(),
		};

		if (existing?.id) {
			await offlineDB.questionRatings.update(existing.id, record);
		} else {
			await offlineDB.questionRatings.add(record as QuestionRating);
		}

		await addToSyncQueue("createRating", {
			questionId: params.questionId,
			subject: params.subject,
			rating: record.rating,
			feedback: params.feedback,
			createdAt: record.createdAt,
		});
	}

	async getRatingsForSubject(subject: string): Promise<QuestionRating[]> {
		return offlineDB.questionRatings
			.where("subject")
			.equals(subject)
			.reverse()
			.toArray();
	}

	async getAllRatings(): Promise<QuestionRating[]> {
		return offlineDB.questionRatings.orderBy("createdAt").reverse().toArray();
	}

	async getRatingStats(): Promise<{
		total: number;
		average: number;
		counts: Record<number, number>;
	}> {
		const all = await offlineDB.questionRatings.toArray();
		const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
		let sum = 0;

		for (const r of all) {
			counts[r.rating] = (counts[r.rating] ?? 0) + 1;
			sum += r.rating;
		}

		return {
			total: all.length,
			average: all.length > 0 ? Math.round((sum / all.length) * 10) / 10 : 0,
			counts,
		};
	}

	async getLowRatedQuestions(
		threshold = 2,
		minRatings = 2,
	): Promise<
		Array<{
			questionId: string;
			subject: string;
			avgRating: number;
			count: number;
		}>
	> {
		const all = await offlineDB.questionRatings.toArray();
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
			if (data.ratings.length >= minRatings) {
				const avg =
					data.ratings.reduce((s, r) => s + r, 0) / data.ratings.length;
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

		return result.sort((a, b) => a.avgRating - b.avgRating);
	}
}

export const questionRatingService = new QuestionRatingService();
