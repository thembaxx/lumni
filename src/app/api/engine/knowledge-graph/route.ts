import { NextResponse } from "next/server";
import { initAI, isAIConfigured } from "@/lib/ai/client";
import {
	fetchGraph,
	getCachedGraph,
	storeGraph,
} from "@/lib/knowledge-graph/service";

export async function POST(request: Request) {
	try {
		const { subject, topic } = await request.json();
		if (!subject || !topic) {
			return NextResponse.json(
				{ error: "subject and topic are required" },
				{ status: 400 },
			);
		}

		const cached = await getCachedGraph(subject, topic);
		if (cached) {
			return NextResponse.json(cached);
		}

		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				nvidiaApiKey: process.env.NVIDIA_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
			});
		}

		const graph = await fetchGraph(subject, topic);

		if (graph.nodes.length === 0) {
			return NextResponse.json(
				{ error: "Failed to generate knowledge graph" },
				{ status: 500 },
			);
		}

		await storeGraph(subject, topic, graph);

		return NextResponse.json(graph);
	} catch (error) {
		console.error("[KnowledgeGraph] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
