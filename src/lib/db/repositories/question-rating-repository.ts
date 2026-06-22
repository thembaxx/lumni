import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import type { QuestionRating } from "@/lib/db/schema";

export interface QuestionRatingRepository {
  findByQuestionId(questionId: string): Promise<QuestionRating | undefined>;
  upsert(
    id: number | undefined,
    record: Partial<QuestionRating> & { createdAt: number },
  ): Promise<void>;
  getAll(): Promise<QuestionRating[]>;
  getBySubject(subject: string): Promise<QuestionRating[]>;
}

class DexieQuestionRatingRepository implements QuestionRatingRepository {
  constructor(private db: DataAccess) {}

  async findByQuestionId(questionId: string): Promise<QuestionRating | undefined> {
    return this.db.questionRatings.where("questionId").equals(questionId).first() ?? undefined;
  }

  async upsert(
    id: number | undefined,
    record: Partial<QuestionRating> & { createdAt: number },
  ): Promise<void> {
    if (id) {
      await this.db.questionRatings.update(id, record);
    } else {
      await this.db.questionRatings.add(record as QuestionRating);
    }
  }

  async getAll(): Promise<QuestionRating[]> {
    return this.db.questionRatings.orderBy("createdAt").reverse().toArray();
  }

  async getBySubject(subject: string): Promise<QuestionRating[]> {
    return this.db.questionRatings.where("subject").equals(subject).reverse().toArray();
  }
}

function createQuestionRatingRepository(db: DataAccess = dexieDataAccess) {
  return new DexieQuestionRatingRepository(db);
}
export const questionRatingRepository = createQuestionRatingRepository();
