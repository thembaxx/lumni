export type VisualContentType = "konva-diagram" | "mermaid-diagram" | "image";

export interface VisualContent {
	type: VisualContentType;
	label: string;
	diagramType?: string;
	diagramData?: Record<string, unknown>;
	mermaidCode?: string;
	imageUrl?: string;
	sourceUrl?: string;
	attribution?: string;
	generatedAt?: string;
	expiresAt?: string;
}

export const STEM_SUBJECTS = new Set([
	"mathematics",
	"mathematical-literacy",
	"technical-mathematics",
	"physical-sciences",
	"technical-sciences",
	"life-sciences",
	"agricultural-sciences",
	"agricultural-management-practices",
	"agricultural-technology",
	"geography",
	"history",
	"accounting",
	"economics",
	"business-studies",
	"english-home-language",
	"english-first-additional-language",
	"afrikaans-home-language",
	"afrikaans-first-additional-language",
	"isi-zulu-home-language",
	"isi-zulu-first-additional-language",
	"isi-xhosa-home-language",
	"isi-xhosa-first-additional-language",
	"sepedi-home-language",
	"sesotho-home-language",
	"information-technology",
	"computer-applications-technology",
	"electrical-technology",
	"civil-technology",
	"mechanical-technology",
	"engineering-graphics-and-design",
	"design",
	"visual-arts",
]);

export interface VisualEngineParams {
	questionId: string;
	questionText: string;
	subject: string;
	topic: string;
}

export type DiagramType =
	| "force-vector"
	| "circuit"
	| "wave"
	| "motion"
	| "geometry"
	| "chart"
	| "chemistry"
	| "graph"
	| "node-flow"
	| "node"
	| "custom-svg"
	| "mermaid";

export interface ForceVectorData {
	objects: Array<{
		type: "rectangle" | "circle";
		x: number;
		y: number;
		width?: number;
		height?: number;
		radius?: number;
		fill: string;
		label?: string;
	}>;
	showForces?: Array<{
		label: string;
		direction: string;
		color: string;
		origin: string;
	}>;
	angle?: number;
}

export interface CircuitData {
	components: Array<{
		type: "resistor" | "battery" | "cell";
		x: number;
		y: number;
		label?: string;
		voltage?: number;
		resistance?: number;
	}>;
	connectionType?: "series" | "parallel";
}

export interface WaveData {
	amplitude: number;
	frequency: number;
	type: "transverse" | "longitudinal" | "standing" | "sound";
	wavelength?: number;
	labels?: Array<{ x: number; y: number; text: string }>;
	showPhoton?: boolean;
}

export interface MotionData {
	projectiles?: Array<{
		startX: number;
		startY: number;
		endX: number;
		endY: number;
		color: string;
		label?: string;
	}>;
	paths?: Array<{
		points: Array<{ x: number; y: number }>;
		color: string;
		dashed?: boolean;
	}>;
	ground?: boolean;
	labels?: Array<{ x: number; y: number; text: string }>;
}

export interface GeometryData {
	shapes: Array<Record<string, unknown>>;
}

export interface ChartData {
	chartType: "bar" | "line" | "pie";
	title?: string;
	data: Array<{ label: string; value: number; color?: string }>;
	xLabel?: string;
	yLabel?: string;
}

export interface ChemistryData {
	molecules: Array<{
		atoms: Array<{
			element: string;
			x: number;
			y: number;
			label?: string;
		}>;
		bonds: Array<{
			fromIndex: number;
			toIndex: number;
			type: "single" | "double" | "triple" | "dashed";
		}>;
	}>;
	reactions?: Array<{
		fromX: number;
		fromY: number;
		toX: number;
		toY: number;
		label?: string;
	}>;
}

export interface GraphData {
	functions: Array<{
		label?: string;
		color?: string;
		points: Array<{ x: number; y: number }>;
		dashed?: boolean;
	}>;
	axes: { xMin: number; xMax: number; yMin: number; yMax: number };
	xLabel?: string;
	yLabel?: string;
	title?: string;
	showGrid?: boolean;
	asymptotes?: Array<{
		type: "vertical" | "horizontal";
		value: number;
		color?: string;
	}>;
	points?: Array<{
		x: number;
		y: number;
		label?: string;
		color?: string;
	}>;
}

export interface NodeFlowData {
	nodes: Array<{
		id: string;
		type?: string;
		label?: string;
		x?: number;
		y?: number;
	}>;
	edges: Array<{ id: string; source: string; target: string }>;
}

export interface CustomSvgData {
	svg: string;
}

export type DiagramDataMap = {
	"force-vector": ForceVectorData;
	circuit: CircuitData;
	wave: WaveData;
	motion: MotionData;
	geometry: GeometryData;
	chart: ChartData;
	chemistry: ChemistryData;
	graph: GraphData;
	"node-flow": NodeFlowData;
	node: NodeFlowData;
	"custom-svg": CustomSvgData;
};

export interface VisualCacheEntry {
	id: string;
	subject: string;
	visual: VisualContent | null;
	createdAt: string;
	expiresAt: string;
}
