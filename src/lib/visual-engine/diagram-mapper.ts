interface DiagramMapping {
	type: string;
	data: Record<string, unknown>;
	confidence: number;
	mermaidFallback?: boolean;
	mermaidCode?: string;
}

const KONVA_TYPES = new Set([
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

function validateForceVector(data: Record<string, unknown>): boolean {
	if (!data.objects || !Array.isArray(data.objects)) return false;
	return data.objects.every(
		(obj) =>
			typeof obj === "object" &&
			obj !== null &&
			"type" in obj &&
			"x" in obj &&
			"y" in obj &&
			"fill" in obj,
	);
}

function validateCircuit(data: Record<string, unknown>): boolean {
	if (!data.components || !Array.isArray(data.components)) return false;
	return data.components.length > 0;
}

function validateWave(data: Record<string, unknown>): boolean {
	return (
		typeof data.amplitude === "number" &&
		typeof data.frequency === "number" &&
		typeof data.type === "string"
	);
}

function validateMotion(data: Record<string, unknown>): boolean {
	return (
		(Array.isArray(data.projectiles) && data.projectiles.length > 0) ||
		(Array.isArray(data.paths) && data.paths.length > 0)
	);
}

function validateGeometry(data: Record<string, unknown>): boolean {
	if (!data.shapes || !Array.isArray(data.shapes)) return false;
	return data.shapes.length > 0;
}

function validateChart(data: Record<string, unknown>): boolean {
	if (
		!data.chartType ||
		!["bar", "line", "pie"].includes(data.chartType as string)
	)
		return false;
	if (!data.data || !Array.isArray(data.data)) return false;
	return data.data.length > 0;
}

function validateChemistry(data: Record<string, unknown>): boolean {
	if (!data.molecules || !Array.isArray(data.molecules)) return false;
	return data.molecules.length > 0;
}

function validateGraph(data: Record<string, unknown>): boolean {
	if (!data.functions || !Array.isArray(data.functions)) return false;
	if (!data.axes || typeof data.axes !== "object") return false;
	const axes = data.axes as Record<string, unknown>;
	return (
		typeof axes.xMin === "number" &&
		typeof axes.xMax === "number" &&
		typeof axes.yMin === "number" &&
		typeof axes.yMax === "number"
	);
}

function validateNodeFlow(data: Record<string, unknown>): boolean {
	if (!data.nodes || !Array.isArray(data.nodes)) return false;
	return data.nodes.length > 0;
}

function validateCustomSvg(data: Record<string, unknown>): boolean {
	return typeof data.svg === "string" && data.svg.includes("<svg");
}

const VALIDATORS: Record<string, (data: Record<string, unknown>) => boolean> = {
	"force-vector": validateForceVector,
	circuit: validateCircuit,
	wave: validateWave,
	motion: validateMotion,
	geometry: validateGeometry,
	chart: validateChart,
	chemistry: validateChemistry,
	graph: validateGraph,
	"node-flow": validateNodeFlow,
	node: validateNodeFlow,
	"custom-svg": validateCustomSvg,
};

export function classifyAndMap(raw: Record<string, unknown>): DiagramMapping {
	const diagramType = (raw.diagramType as string) || "";
	const data = (raw.diagramData as Record<string, unknown>) || raw.data || {};
	const confidence = (raw.confidence as number) ?? 0.5;
	const mermaidCode = (raw.mermaidCode as string) || "";
	const mermaidFallback = !!(raw.mermaidFallback as boolean);

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
		if (diagramType === "custom-svg") {
			return { type: "custom-svg", data: { svg: "" }, confidence: 0 };
		}
		return { type: "custom-svg", data: { svg: "" }, confidence: 0 };
	}

	return {
		type: diagramType,
		data,
		confidence,
		mermaidFallback,
		mermaidCode,
	};
}

export function isKonvaType(type: string): boolean {
	return KONVA_TYPES.has(type);
}
