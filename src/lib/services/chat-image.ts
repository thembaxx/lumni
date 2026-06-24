import { CHAT_SYSTEM_PROMPT, generateWithSystem } from "@/lib/ai/client";
import { HttpError } from "@/lib/api/create-route-handler";

interface ChatImageBody {
  imageUrl: string;
  imageName?: string;
}

export const chatImageService = {
  async execute(body: ChatImageBody) {
    const { imageUrl, imageName } = body;

    const userPrompt = imageName
      ? `Please analyze this image (${imageName}) and help me with any questions I might have about it.`
      : "Please analyze this image and help me with any questions I might have about it.";

    const result = await generateWithSystem(CHAT_SYSTEM_PROMPT, userPrompt, {
      temperature: 0.7,
      maxTokens: 1024,
      imageUrl,
    });

    if (!("available" in result) || !result.available) {
      const errorResult = result as { error?: string };
      throw new HttpError(
        500,
        errorResult.error || "AI service is currently unavailable. Please try again.",
      );
    }

    const content = (result as { content?: string }).content;

    return {
      content: content || "I can see your image. How can I help you with it?",
      provider: result.provider,
    };
  },
};
