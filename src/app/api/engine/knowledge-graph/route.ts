import { initAI, isAIConfigured } from "@/lib/ai/client";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import {
	fetchGraph,
	getCachedGraph,
	storeGraph,
} from "@/lib/knowledge-graph/service";
import type { KnowledgeGraph } from "@/lib/knowledge-graph/types";

const EMPTY_GRAPH: KnowledgeGraph = { nodes: [], edges: [] };

export const POST = createRouteHandler({
	auth: "none",
	validate: (body: { subject?: string; topic?: string }) => {
		if (!body.subject || !body.topic) return "subject and topic are required";
		return null;
	},
	execute: async ({ body }: { body: { subject: string; topic: string } }) => {
		const { subject, topic } = body;

		const cached = await getCachedGraph(subject, topic);
		if (cached) return cached;

		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				nvidiaApiKey: process.env.NVIDIA_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
			});
			if (!isAIConfigured()) {
				return EMPTY_GRAPH;
			}
		}

		const graph = await fetchGraph(subject, topic);

		if (graph.nodes.length === 0) {
			return EMPTY_GRAPH;
		}

		await storeGraph(subject, topic, graph);

		return graph;
	},
	errorLabel: "KnowledgeGraph",
});
