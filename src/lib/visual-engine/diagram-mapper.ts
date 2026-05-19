import type { DiagramDataMap, DiagramType } from "./types";

interface DiagramMapping {
	type: DiagramType;
	data: Record<string, unknown>;
	confidence: number;
	mermaidCode?: string;
}

export const KONVA_TYPES: ReadonlySet<string> = new Set([
	"force-vector",
	"circuit",
	"wave",
	"motion",
	"geometry",
	"chart",
	"chemistry",
	"graph",
	"node-flow",
	"node",
	"custom-svg",
]);

const MIN_CONFIDENCE = 0.3;

type Validator = (data: Record<string, unknown>) => boolean;

const VALIDATORS: Record<string, Validator> = {
	"force-vector": (d) => {
		const data = d as Record<string, unknown>;
		if (!Array.isArray(data.objects)) return false;
		return (data.objects as Record<string, unknown>[]).every(
			(obj) =>
				typeof obj.type === "string" &&
				typeof obj.x === "number" &&
				typeof obj.y === "number" &&
				typeof obj.fill === "string",
		);
	},
	circuit: (d) => {
		const data = d as Record<string, unknown>;
		return Array.isArray(data.components) && data.components.length > 0;
	},
	wave: (d) => {
		const data = d as Record<string, unknown>;
		return (
			typeof data.amplitude === "number" &&
			typeof data.frequency === "number" &&
			typeof data.type === "string"
		);
	},
	motion: (d) => {
		const data = d as Record<string, unknown>;
		return (
			(Array.isArray(data.projectiles) && data.projectiles.length > 0) ||
			(Array.isArray(data.paths) && data.paths.length > 0)
		);
	},
	geometry: (d) => {
		const data = d as Record<string, unknown>;
		return Array.isArray(data.shapes) && data.shapes.length > 0;
	},
	chart: (d) => {
		const data = d as Record<string, unknown>;
		if (
			!data.chartType ||
			!["bar", "line", "pie"].includes(data.chartType as string)
		)
			return false;
		return Array.isArray(data.data) && data.data.length > 0;
	},
	chemistry: (d) => {
		const data = d as Record<string, unknown>;
		return Array.isArray(data.molecules) && data.molecules.length > 0;
	},
	graph: (d) => {
		const data = d as Record<string, unknown>;
		if (!Array.isArray(data.functions)) return false;
		const axes = data.axes as Record<string, unknown> | undefined;
		return !!(
			axes &&
			typeof axes.xMin === "number" &&
			typeof axes.xMax === "number" &&
			typeof axes.yMin === "number" &&
			typeof axes.yMax === "number"
		);
	},
	"node-flow": (d) => {
		const data = d as Record<string, unknown>;
		return Array.isArray(data.nodes) && data.nodes.length > 0;
	},
	node: (d) => {
		const data = d as Record<string, unknown>;
		return Array.isArray(data.nodes) && data.nodes.length > 0;
	},
	"custom-svg": (d) => {
		const data = d as Record<string, unknown>;
		return typeof data.svg === "string" && data.svg.includes("<svg");
	},
};

export function getValidator(type: string): Validator | undefined {
	return VALIDATORS[type];
}

export function getDataForType<K extends keyof DiagramDataMap>(
	type: K,
	data: Record<string, unknown>,
): DiagramDataMap[K] | null {
	const validator = VALIDATORS[type as string];
	if (!validator?.(data)) return null;
	return data as unknown as DiagramDataMap[K];
}

export function classifyAndMap(raw: Record<string, unknown>): DiagramMapping {
	const diagramType = (raw.diagramType as string) || "";
	const data = (raw.diagramData as Record<string, unknown>) || raw.data || {};
	const confidence = (raw.confidence as number) ?? 0.5;
	const mermaidCode = (raw.mermaidCode as string) || "";

	if (!diagramType || !KONVA_TYPES.has(diagramType)) {
		if (mermaidCode) {
			return { type: "mermaid", data: {}, confidence: 0.6, mermaidCode };
		}
		return { type: "custom-svg", data: { svg: "" }, confidence: 0 };
	}

	const validator = VALIDATORS[diagramType];
	const isValid = validator ? validator(data) : false;

	if (!isValid || confidence < MIN_CONFIDENCE) {
		if (mermaidCode) {
			return { type: "mermaid", data: {}, confidence: 0.4, mermaidCode };
		}
		return { type: "custom-svg", data: { svg: "" }, confidence: 0 };
	}

	return {
		type: diagramType as DiagramType,
		data,
		confidence,
		mermaidCode,
	};
}

export function isKonvaType(type: string): boolean {
	return KONVA_TYPES.has(type);
}
