import { createRouteHandler } from "@/lib/api/create-route-handler";
import {
  importStory,
  buildStoryJson,
  listAvailableStories,
} from "@/lib/stories/african-storybook-importer";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "ImportStory",
  useRateLimit: true,

  parseBody: async (req) => {
    const body: {
      languageCode: string;
      storyId?: string;
    } = await req.json();
    return body;
  },

  validate: (body) => {
    if (!body.languageCode) return "languageCode is required";
    if (!/^(af|en|zu|xh|st|tn|nso|ts|ss|ve|nr)$/.test(body.languageCode)) {
      return "Invalid languageCode. Must be one of: af, en, zu, xh, st, tn, nso, ts, ss, ve, nr";
    }
    return null;
  },

  execute: async ({ body }) => {
    const { languageCode, storyId } = body;

    if (storyId) {
      const imported = await importStory(languageCode, storyId);
      if (!imported) {
        return { error: `Story ${storyId} not found for language ${languageCode}` };
      }
      const built = buildStoryJson(imported, languageCode);
      return built;
    }

    const available = await listAvailableStories(languageCode);
    const results: Array<Record<string, unknown>> = [];

    for (const { storyId: sid } of available) {
      const imported = await importStory(languageCode, sid);
      if (imported) {
        const built = buildStoryJson(imported, languageCode);
        results.push(built as unknown as Record<string, unknown>);
      }
    }

    return {
      languageCode,
      count: results.length,
      stories: results,
    };
  },
});
