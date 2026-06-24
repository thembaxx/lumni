import { initAI, isAIConfigured } from "@/lib/ai";
import { type CachingStrategy, createCachingStrategy } from "@/lib/caching-strategy";
import { getDataSharingConsent } from "@/lib/consent/ai-gate";
import { makeCacheKey, visualCacheRepo } from "@/lib/db/repositories/visual-cache";
import { logError } from "@/lib/shared/logger";
import { searchImage } from "./image-resolver";
import { generateDiagram } from "./stem-renderer";
import type { VisualContent, VisualEngineParams } from "./types";
import { STEM_SUBJECTS } from "./types";
import { loadVisualFromAppwrite, saveVisualToAppwrite } from "./visual-persistence";

/**
 * Generates visual content (diagrams or images) for questions based on the subject classification.
 * The engine determines whether to use AI-generated diagrams for STEM subjects or search
 * Wikimedia Commons images for non-STEM subjects, with intelligent caching and fallbacks.
 * Visual content includes proper attribution and source information for educational use.
 */
export class VisualEngine {
  private cachingStrategy: CachingStrategy<VisualContent, VisualEngineParams>;

  /**
   * Creates a new VisualEngine instance with multi-tier caching strategy.
   * The constructor sets up caching backends including local Dexie storage,
   * cloud Appwrite storage, and AI generation as fallback.
   */
  constructor() {
    this.cachingStrategy = createCachingStrategy<VisualContent, VisualEngineParams>(
      [
        {
          name: "dexie",
          read: async (params) => {
            const cacheKey = makeCacheKey(params.questionId, params.subject);
            return visualCacheRepo.getVisual(cacheKey);
          },
          write: async (params, visual) => {
            const cacheKey = makeCacheKey(params.questionId, params.subject);
            await visualCacheRepo.cacheVisual(cacheKey, params.subject, visual);
          },
        },
        {
          name: "appwrite",
          read: async (params) => {
            try {
              return loadVisualFromAppwrite(params.questionId, params.subject);
            } catch (err) {
              logError("VisualEngine", err);
              return null;
            }
          },
          write: async (params, visual) => {
            await saveVisualToAppwrite(params.questionId, params.subject, visual);
          },
        },
      ],
      (params) => this.generate(params),
    );
  }

  /**
   * Initializes the VisualEngine with AI configuration for diagram generation.
   * This static factory method handles AI client initialization and should be called
   * once at application startup. If AI is not configured, it initializes the
   * default provider chain with keys from environment variables.
   */
  static initialize(): void {
    if (!isAIConfigured()) {
      initAI({
        geminiApiKey: process.env.GEMINI_API_KEY,
        groqApiKey: process.env.GROQ_API_KEY,
      });
    }
  }

  /**
   * Resolves visual content for a question using intelligent caching and fallbacks.
   * This method checks the cache first (Dexie, then Appwrite), and falls back to
   * AI generation if no cached visual content is found. For STEM subjects,
   * it generates diagrams when consent is given; for non-STEM subjects, it searches
   * for appropriate images.
   *
   * @param params - Visual engine parameters including question ID, text, subject,
   *                and topic for visual content generation.
   * @returns A Promise that resolves to VisualContent (diagram or image) or null
   *         if no visual content is available.
   */
  async resolve(params: VisualEngineParams): Promise<VisualContent | null> {
    return this.cachingStrategy.resolve(params);
  }

  /**
   * Generates visual content for a question using AI with caching support.
   * This private method handles the actual visual generation logic, determining
   * whether to use AI-generated diagrams (for STEM subjects) or image search
   * (for non-STEM subjects), with proper consent handling and error recovery.
   *
   * @param params - Parameters for visual generation including question details.
   * @returns A Promise that resolves to VisualContent (diagram or image) or null
   *         if visual generation fails or is not permitted.
   */
  private async generate(params: VisualEngineParams): Promise<VisualContent | null> {
    const isSTEM = STEM_SUBJECTS.has(params.subject);

    if (isSTEM) {
      const diagram = getDataSharingConsent()
        ? await generateDiagram(params.questionText, params.subject, params.topic)
        : null;
      if (diagram) return diagram;
      const fallback = await searchImage(params.questionText, params.subject, params.topic);
      if (!fallback) return null;
      return {
        type: "image",
        label: fallback.title,
        imageUrl: fallback.url,
        attribution: fallback.attribution,
        sourceUrl: fallback.pageUrl,
      };
    }

    const image = await searchImage(params.questionText, params.subject, params.topic);
    if (image) {
      return {
        type: "image",
        label: image.title,
        imageUrl: image.url,
        attribution: image.attribution,
        sourceUrl: image.pageUrl,
      };
    }

    return getDataSharingConsent()
      ? generateDiagram(params.questionText, params.subject, params.topic)
      : null;
  }
}

export const visualEngine = new VisualEngine();
