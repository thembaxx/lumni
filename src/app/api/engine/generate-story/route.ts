import { ensureAI } from "@/lib/ai";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { generateStoryContent, storeGeneratedStory } from "@/lib/stories/service";
import type { Story } from "@/lib/stories/types";

const EMPTY_RESULT = { story: null, error: "AI not configured" };

export const POST = createRouteHandler({
  auth: "required",
  validate: (body: {
    language?: string;
    languageId?: string;
    gradeLevel?: string;
    topic?: string;
    subject?: string;
  }) => {
    if (!body.language) return "language is required";
    if (!body.languageId) return "languageId is required";
    if (!body.gradeLevel) return "gradeLevel is required";
    if (!body.topic) return "topic is required";
    return null;
  },
  execute: async ({
    body,
  }: {
    body: {
      language: string;
      languageId: string;
      gradeLevel: string;
      topic: string;
      subject: string;
    };
  }) => {
    const { language, languageId, gradeLevel, topic, subject } = body;

    if (!ensureAI()) return EMPTY_RESULT;

    const content = await generateStoryContent({
      language,
      languageId,
      gradeLevel,
      topic,
      subject,
    });

    if (!content) {
      return { story: null, error: "Failed to generate story content" };
    }

    const story: Story = {
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: topic,
      author: "Lumni AI",
      language,
      languageId,
      gradeLevel,
      wordCount: content.content.split(/\s+/).length,
      subjects: [subject],
      source: "ai-generated",
      sourceUrl: "",
      topics: [topic],
      readTimeMinutes:
        content.readTimeMinutes ??
        Math.max(1, Math.round(content.content.split(/\s+/).length / 150)),
      license: "ai-generated",
      content: content.content,
      vocabulary: content.vocabulary ?? [],
    };

    await storeGeneratedStory(story);

    return { story, error: null };
  },
  errorLabel: "GenerateStory",
});
