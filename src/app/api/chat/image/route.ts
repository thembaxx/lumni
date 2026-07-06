import { createRouteHandler } from "@/lib/api/create-route-handler";
import { chatImageService } from "@/lib/services/chat-image";

interface ChatImageBody {
  imageUrl: string;
  imageName?: string;
}

export const POST = createRouteHandler<ChatImageBody>({
  auth: "required",
  budget: "generate",
  errorLabel: "ChatImage",
  useRateLimit: true,
  aiContext: { consentGranted: true },
  parseBody: async (req) => {
    const body: ChatImageBody = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.imageUrl) return "No image provided";
    return null;
  },
  execute: async ({ body }) => chatImageService.execute(body),
});
