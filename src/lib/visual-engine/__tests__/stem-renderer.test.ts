import { describe, expect, mock, test } from "bun:test";

mock.module("@/lib/ai", () => ({
	getAI: () => ({
		generateWithSystem: async (_system: string, userPrompt: string) => {
			const parsed = JSON.parse(userPrompt);
			if (parsed.question === "valid") {
				return {
					content: JSON.stringify({
						diagramType: "wave",
						diagramData: { amplitude: 10, frequency: 5, type: "transverse" },
						title: "Wave Diagram",
					}),
					provider: "mock",
					model: "mock",
				};
			}
			if (parsed.question === "invalid-json") {
				return {
					content: "not valid json at all",
					provider: "mock",
					model: "mock",
				};
			}
			if (parsed.question === "ai-failure") {
				return {
					error: "All providers failed",
					provider: "none",
					available: false,
				};
			}
			return {
				content: JSON.stringify({
					diagramType: "unknown-type",
					diagramData: {},
				}),
				provider: "mock",
				model: "mock",
			};
		},
	}),
	isAIConfigured: () => true,
	initAI: () => {},
}));

mock.module("@/lib/ai/parse-response", () => ({
	cleanResponse: (content: string) => content.trim(),
}));

mock.module("@/lib/ai/types", () => ({}));

mock.module("../diagram-mapper", () => ({
	classifyAndMap: (raw: Record<string, unknown>) => {
		const diagramType = raw.diagramType as string;
		const data = raw.diagramData as Record<string, unknown>;
		if (diagramType === "wave") {
			return { type: "wave", data, confidence: 0.9 };
		}
		return { type: "custom-svg", data: { svg: "" }, confidence: 0 };
	},
	isKonvaType: (type: string) =>
		[
			"force-vector",
			"wave",
			"circuit",
			"geometry",
			"chart",
			"chemistry",
			"graph",
			"motion",
			"node-flow",
			"node",
			"custom-svg",
		].includes(type),
}));

import { generateDiagram, isDiagramType } from "../stem-renderer";

describe("generateDiagram", () => {
	test("returns konva-diagram for valid diagram data", async () => {
		const result = await generateDiagram("valid", "physical-sciences", "waves");
		expect(result).not.toBeNull();
		expect(result?.type).toBe("konva-diagram");
		expect(result?.diagramType).toBe("wave");
	});

	test("returns null when AI fails", async () => {
		const result = await generateDiagram("ai-failure", "math", "algebra");
		expect(result).toBeNull();
	});

	test("returns konva-diagram with label from title", async () => {
		const result = await generateDiagram("valid", "physical-sciences", "waves");
		expect(result?.label).toBe("Wave Diagram");
	});
});

describe("isDiagramType", () => {
	test("returns true for known konva types", () => {
		expect(isDiagramType("wave")).toBe(true);
		expect(isDiagramType("geometry")).toBe(true);
	});

	test("returns false for unknown types", () => {
		expect(isDiagramType("unknown")).toBe(false);
	});
});
