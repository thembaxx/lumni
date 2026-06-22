import { getAI } from "@/lib/ai/client";
import { isAIFailure } from "@/lib/ai/parse-response";
import { logError } from "@/lib/shared/logger";
import type { TopicPlan } from "@/lib/study-planner/types";

interface EnrichedSession {
  topicId: string;
  subjectId: string;
  suggestedMinutes: number;
  studyTip?: string;
  focusArea?: string;
}

const ENRICH_PROMPT = `You are an AI study planner for South African Grade 12 students. Given a list of scheduled study topics with their estimated minutes and priority levels, personalize the schedule by:

1. Adjusting time allocations based on priority (high-priority topics get more time)
2. Suggesting a specific study tip for each topic
3. Identifying the focus area (what to concentrate on)

Return a JSON array with one object per topic:
[{
  "topicId": "string",
  "subjectId": "string",
  "suggestedMinutes": number,
  "studyTip": "string (1 sentence, specific to the topic)",
  "focusArea": "string (e.g. 'practice calculations', 'memorize definitions')"
}]

Rules:
- Keep total minutes roughly the same as input (±20%)
- High priority (≥8) topics get 20-30% more time
- Low priority (≤3) topics get 10-20% less time
- Tips should be actionable and specific to the subject
- Focus areas should match Bloom levels (e.g., 'remember' = memorize, 'apply' = practice)
- Return ONLY the JSON array, no other text`;

export async function enrichPlanWithAI(
  topics: Array<TopicPlan & { scheduledDate?: string }>,
): Promise<EnrichedSession[]> {
  let ai: ReturnType<typeof getAI>;
  try {
    ai = getAI();
  } catch {
    return topics.map(mapToEnriched);
  }
  if (!ai) return topics.map(mapToEnriched);

  const input = topics.map((t) => ({
    topicId: t.topicId,
    subjectId: t.subjectId,
    estimatedMinutes: Math.round(t.estimatedMinutes),
    priority: t.priority,
  }));

  const userPrompt = `Topics to personalize:\n${JSON.stringify(input, null, 2)}`;

  try {
    const response = await ai.generateWithSystem(ENRICH_PROMPT, userPrompt);
    if (isAIFailure(response)) {
      logError("AIPlannerEnrich", response.error);
      return topics.map(mapToEnriched);
    }

    const parsed = JSON.parse(response.content) as EnrichedSession[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return topics.map(mapToEnriched);
    }

    const enrichedMap = new Map(parsed.map((e) => [e.topicId, e]));
    return topics.map((t) => {
      const aiResult = enrichedMap.get(t.topicId);
      if (!aiResult) return mapToEnriched(t);
      return {
        topicId: t.topicId,
        subjectId: t.subjectId,
        suggestedMinutes: aiResult.suggestedMinutes,
        studyTip: aiResult.studyTip,
        focusArea: aiResult.focusArea,
      };
    });
  } catch (e) {
    logError("AIPlannerEnrich", e);
    return topics.map(mapToEnriched);
  }
}

function mapToEnriched(t: TopicPlan): EnrichedSession {
  return {
    topicId: t.topicId,
    subjectId: t.subjectId,
    suggestedMinutes: Math.round(t.estimatedMinutes),
  };
}
