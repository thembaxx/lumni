import { createAIHandler } from "@/lib/api/create-ai-handler";
import { chatImageService } from "@/lib/services/chat-image";

interface ChatImageBody {
	imageUrl: string;
	imageName?: string;
}

export const POST = createAIHandler<ChatImageBody>({
	budgetType: "generate",
	errorLabel: "ChatImage",
	parseBody: async (req) => {
		const body: ChatImageBody = await req.json();
		return body;
	},
	validate: (body) => {
		if (!body.imageUrl) return "No image provided";
		return null;
	},
	service: chatImageService,
});
