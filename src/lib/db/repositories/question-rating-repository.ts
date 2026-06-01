import { offlineDB, type QuestionRating } from "@/lib/db/schema";

export interface QuestionRatingRepository {
	findByQuestionId(questionId: string): Promise<QuestionRating | undefined>;
	upsert(id: number | undefined, record: Partial<QuestionRating> & { createdAt: number }): Promise<void>;
	getAll(): Promise<QuestionRating[]>;
	getBySubject(subject: string): Promise<QuestionRating[]>;
}

export class DexieQuestionRatingRepository implements QuestionRatingRepository {
	async findByQuestionId(questionId: string): Promise<QuestionRating | undefined> {
		return offlineDB.questionRatings.where("questionId").equals(questionId).first() ?? undefined;
	}

	async upsert(id: number | undefined, record: Partial<QuestionRating> & { createdAt: number }): Promise<void> {
		if (id) {
			await offlineDB.questionRatings.update(id, record);
		} else {
			await offlineDB.questionRatings.add(record as QuestionRating);
		}
	}

	async getAll(): Promise<QuestionRating[]> {
		return offlineDB.questionRatings.orderBy("createdAt").reverse().toArray();
	}

	async getBySubject(subject: string): Promise<QuestionRating[]> {
		return offlineDB.questionRatings.where("subject").equals(subject).reverse().toArray();
	}
}
