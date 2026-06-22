import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { embedText } from "@/lib/embedding/client";
import { findTopK } from "@/lib/embedding/similarity";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import { logError } from "@/lib/shared/logger";
import { recordSeenQuestions, selectAdaptiveQuestions } from "./adaptive-selector";
import type { GenerationParams } from "./types";

export interface EnrichmentDeps {
  db: DataAccess;
}

const DEFAULT_DEPS: EnrichmentDeps = { db: dexieDataAccess };

let _deps: EnrichmentDeps = DEFAULT_DEPS;
export function __setDepsForTesting(deps: EnrichmentDeps) {
  _deps = deps;
}

interface CurriculumSource {
  fetchCurriculumContext(subject: string, topic?: string): Promise<string | null>;
}

interface EmbeddingSource {
  fetchEmbeddingResults(
    subject: string,
    topic?: string,
    exampleCount?: number,
    pastPaperMode?: boolean,
  ): Promise<{
    poolQuestions: GenerationParams["poolQuestions"];
    pastPaperExamples: GenerationParams["pastPaperExamples"];
  }>;
}

interface PastPaperSource {
  fetchPastPaperExamples(
    subject: string,
    topic?: string,
    limit?: number,
  ): Promise<{ questionText: string; answerText: string; marks: number; year: number }[]>;
}

function createCurriculumSource(): CurriculumSource {
  return {
    async fetchCurriculumContext(_subject: string, topic?: string): Promise<string | null> {
      if (!topic) return null;
      try {
        const [{ listDocuments }, { Query }, { COLLECTIONS }] = await Promise.all([
          import("@/lib/db/client"),
          import("appwrite"),
          import("@/lib/db/client"),
        ]);
        const results = await listDocuments(COLLECTIONS.TOPICS, [
          Query.equal("name", topic),
          Query.limit(1),
        ]);
        if (results.length > 0) {
          const doc = results[0] as Record<string, unknown>;
          return (doc.description as string) ?? null;
        }
        return null;
      } catch (e) {
        console.warn("Retrieve curriculum context failed:", e);
        return null;
      }
    },
  };
}

function createEmbeddingSource(db: DataAccess): EmbeddingSource {
  return {
    async fetchEmbeddingResults(
      subject: string,
      topic?: string,
      exampleCount = 3,
      pastPaperMode = false,
    ): Promise<{
      poolQuestions: GenerationParams["poolQuestions"];
      pastPaperExamples: GenerationParams["pastPaperExamples"];
    }> {
      const poolQuestions: NonNullable<GenerationParams["poolQuestions"]> = [];
      let pastPaperExamples: GenerationParams["pastPaperExamples"] = [];

      try {
        const queryText = topic ? `${subject}: ${topic}` : subject;
        const embedding = await embedText(queryText);
        if (!embedding) return { poolQuestions, pastPaperExamples };

        const fetchK = pastPaperMode ? Math.max(exampleCount * 3, 15) : exampleCount + 2;
        const scored = await findTopK(
          {
            subject,
            queryEmbedding: new Float32Array(embedding),
            k: fetchK,
            threshold: 0.4,
          },
          {
            questionEmbeddings: db.questionEmbeddings,
            pastPaperQuestions: db.pastPaperQuestions,
          },
        );

        if (pastPaperMode && scored.length > 0) {
          const selected = await selectAdaptiveQuestions(scored, subject, exampleCount, { db });

          await recordSeenQuestions(
            selected.map((q) => q.questionId),
            subject,
            { db },
          );

          for (const sq of selected) {
            poolQuestions.push({
              id: sq.questionId,
              questionText: sq.questionText,
              answerText: sq.answerText,
              marks: sq.marks,
              year: sq.year,
              paperNumber: sq.paperNumber,
              topic: sq.topic,
              similarity: sq.similarity,
              type: sq.type,
              bloomLevel: sq.bloomLevel,
              subtopicId: sq.subtopicId,
            });
          }
        } else {
          for (const sq of scored) {
            if (sq.similarity > 0.8) {
              poolQuestions.push({
                id: sq.questionId,
                questionText: sq.questionText,
                answerText: sq.answerText,
                marks: sq.marks,
                year: sq.year,
                paperNumber: sq.paperNumber,
                topic: sq.topic,
                similarity: sq.similarity,
                type: sq.type,
                bloomLevel: sq.bloomLevel,
                subtopicId: sq.subtopicId,
              });
            }
          }
        }

        pastPaperExamples = scored
          .filter((q) => q.similarity >= 0.5 && q.similarity <= 0.8)
          .slice(0, exampleCount)
          .map((q) => ({
            questionText: q.questionText,
            answerText: q.answerText,
            marks: q.marks,
            year: q.year,
          }));

        return { poolQuestions, pastPaperExamples };
      } catch (e) {
        logError("QuestionEngineEmbedding", e);
        return { poolQuestions, pastPaperExamples };
      }
    },
  };
}

function createPastPaperSource(): PastPaperSource {
  return {
    async fetchPastPaperExamples(
      subject: string,
      topic?: string,
      limit = 3,
    ): Promise<
      {
        questionText: string;
        answerText: string;
        marks: number;
        year: number;
      }[]
    > {
      if (!subject) return [];
      try {
        const url = new URL(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/exam-papers/questions`,
        );
        url.searchParams.set("subject", subject);
        if (topic) url.searchParams.set("topic", topic);
        url.searchParams.set("limit", String(limit));

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.questions as PastPaperQuestion[]).slice(0, limit).map((q) => ({
          questionText: q.questionText,
          answerText: q.answerText,
          marks: q.marks,
          year: q.year,
        }));
      } catch (err) {
        logError("RetrievePastPaperExamples", err);
        return [];
      }
    },
  };
}

export interface EnrichmentPipeline {
  enrich(params: GenerationParams): Promise<GenerationParams>;
}

export function createEnrichmentPipeline(deps: EnrichmentDeps = _deps): EnrichmentPipeline {
  const curriculum = createCurriculumSource();
  const embeddings = createEmbeddingSource(deps.db);
  const pastPapers = createPastPaperSource();

  return {
    async enrich(params: GenerationParams): Promise<GenerationParams> {
      const exampleCount = params.pastPaperMode ? 5 : 3;

      const [curriculumContext, embeddingResults] = await Promise.all([
        curriculum.fetchCurriculumContext(params.subject, params.topic),
        embeddings.fetchEmbeddingResults(
          params.subject,
          params.topic,
          exampleCount,
          params.pastPaperMode,
        ),
      ]);

      const { poolQuestions, pastPaperExamples: embeddingExamples } = embeddingResults;

      let pastPaperExamples = embeddingExamples ?? [];

      if (pastPaperExamples.length === 0) {
        pastPaperExamples = await pastPapers.fetchPastPaperExamples(
          params.subject,
          params.topic,
          exampleCount,
        );
      }

      return {
        ...params,
        ...(curriculumContext ? { curriculumContext } : {}),
        ...(poolQuestions && poolQuestions.length > 0 ? { poolQuestions } : {}),
        ...(pastPaperExamples.length > 0 ? { pastPaperExamples } : {}),
      };
    },
  };
}
