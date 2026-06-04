import { getAI } from "@/lib/ai";
import { cleanResponse } from "@/lib/ai/parse-response";
import type { AIResponse } from "@/lib/ai/types";
import { logError } from "@/lib/shared/logger";
import { classifyAndMap, isKonvaType } from "./diagram-mapper";
import { getDiagramPrompt, getMermaidPrompt } from "./prompts";
import type { VisualContent } from "./types";

export async function generateDiagram(
	questionText: string,
	subject: string,
	topic: string,
): Promise<VisualContent | null> {
	const prompt = getDiagramPrompt(questionText, subject, topic);
	const result = await getAI().generateWithSystem(prompt.system, prompt.user, {
		temperature: 0.7,
		maxTokens: 4096,
	});

	if ("available" in result && !result.available) return null;

	try {
		const raw = JSON.parse(
			cleanResponse((result as AIResponse).content),
		) as Record<string, unknown>;
		const mapping = classifyAndMap(raw);

		if (mapping.confidence === 0 && !mapping.mermaidCode) return null;

		if (mapping.type === "mermaid" && mapping.mermaidCode) {
			return {
				type: "mermaid-diagram",
				label: "Diagram",
				mermaidCode: mapping.mermaidCode,
			};
		}

		return {
			type: "konva-diagram",
			label: raw.title ? String(raw.title) : "Diagram",
			diagramType: mapping.type,
			diagramData: mapping.data,
		};
	} catch (err) {
		logError("StemRenderer", err);
		return fallbackToMermaid(questionText, subject, topic);
	}
}

async function fallbackToMermaid(
	questionText: string,
	subject: string,
	topic: string,
): Promise<VisualContent | null> {
	const prompt = getMermaidPrompt(questionText, subject, topic);

	const result = await getAI().generateWithSystem(prompt.system, prompt.user, {
		temperature: 0.5,
		maxTokens: 2048,
	});

	if ("available" in result && !result.available) return null;

	const code = cleanResponse((result as AIResponse).content);
	if (!code || code.length < 10) return null;

	return {
		type: "mermaid-diagram",
		label: "Diagram",
		mermaidCode: code,
	};
}

export function isDiagramType(type: string): boolean {
	return isKonvaType(type);
}
