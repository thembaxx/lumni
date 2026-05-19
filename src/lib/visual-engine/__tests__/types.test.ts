import { describe, expect, test } from "bun:test";
import type {
	ChartData,
	ChemistryData,
	CircuitData,
	CustomSvgData,
	DiagramDataMap,
	DiagramType,
	ForceVectorData,
	GeometryData,
	GraphData,
	MotionData,
	NodeFlowData,
	VisualContent,
	VisualContentType,
	VisualEngineParams,
	WaveData,
} from "../types";
import { STEM_SUBJECTS } from "../types";

describe("VisualContent type", () => {
	test("can create konva-diagram content", () => {
		const vc: VisualContent = {
			type: "konva-diagram",
			label: "Forces on a block",
			diagramType: "force-vector",
			diagramData: { objects: [] },
		};
		expect(vc.type).toBe("konva-diagram");
		expect(vc.diagramType).toBe("force-vector");
	});

	test("can create mermaid-diagram content", () => {
		const vc: VisualContent = {
			type: "mermaid-diagram",
			label: "Flowchart",
			mermaidCode: "graph TD; A-->B;",
		};
		expect(vc.type).toBe("mermaid-diagram");
		expect(vc.mermaidCode).toBe("graph TD; A-->B;");
	});

	test("can create image content", () => {
		const vc: VisualContent = {
			type: "image",
			label: "Cell diagram",
			imageUrl: "https://example.com/cell.png",
			attribution: "Author",
			sourceUrl: "https://commons.wikimedia.org/wiki/File:Cell.png",
		};
		expect(vc.type).toBe("image");
		expect(vc.imageUrl).toContain("example.com");
	});

	test("VisualContentType union values", () => {
		const types: VisualContentType[] = ["konva-diagram", "mermaid-diagram", "image"];
		expect(types).toHaveLength(3);
	});
});

describe("VisualEngineParams", () => {
	test("has required fields", () => {
		const params: VisualEngineParams = {
			questionId: "q1",
			questionText: "What is this?",
			subject: "mathematics",
			topic: "algebra",
		};
		expect(params.questionId).toBe("q1");
		expect(params.subject).toBe("mathematics");
	});
});

describe("DiagramType", () => {
	test("includes all 11 diagram types", () => {
		const types: DiagramType[] = [
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
		];
		expect(types).toHaveLength(11);
	});

	test("mermaid is not a DiagramType", () => {
		const types: string[] = [
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
		];
		expect(types).not.toContain("mermaid");
	});
});

describe("DiagramDataMap", () => {
	test("maps force-vector to ForceVectorData", () => {
		const data: DiagramDataMap["force-vector"] = {
			objects: [{ type: "rectangle", x: 10, y: 20, fill: "blue" }],
		};
		expect(data.objects[0].type).toBe("rectangle");
	});

	test("maps circuit to CircuitData", () => {
		const data: DiagramDataMap["circuit"] = {
			components: [{ type: "battery", x: 50, y: 50, voltage: 12 }],
			connectionType: "series",
		};
		expect(data.components[0].voltage).toBe(12);
	});

	test("maps wave to WaveData", () => {
		const data: DiagramDataMap["wave"] = {
			amplitude: 5,
			frequency: 10,
			type: "transverse",
			wavelength: 2,
			labels: [{ x: 0, y: 0, text: "crest" }],
		};
		expect(data.amplitude).toBe(5);
		expect(data.labels).toHaveLength(1);
	});

	test("maps motion to MotionData", () => {
		const data: DiagramDataMap["motion"] = {
			projectiles: [
				{ startX: 0, startY: 0, endX: 10, endY: 20, color: "red" },
			],
			ground: true,
		};
		expect(data.projectiles).toHaveLength(1);
	});

	test("maps geometry to GeometryData", () => {
		const data: DiagramDataMap["geometry"] = {
			shapes: [{ type: "circle", radius: 5 }],
		};
		expect(data.shapes).toHaveLength(1);
	});

	test("maps chart to ChartData", () => {
		const data: DiagramDataMap["chart"] = {
			chartType: "bar",
			title: "Sales",
			data: [{ label: "Q1", value: 100, color: "red" }],
		};
		expect(data.chartType).toBe("bar");
	});

	test("maps chemistry to ChemistryData", () => {
		const data: DiagramDataMap["chemistry"] = {
			molecules: [
				{
					atoms: [{ element: "C", x: 0, y: 0 }],
					bonds: [{ fromIndex: 0, toIndex: 1, type: "single" }],
				},
			],
		};
		expect(data.molecules[0].atoms[0].element).toBe("C");
	});

	test("maps graph to GraphData", () => {
		const data: DiagramDataMap["graph"] = {
			functions: [
				{
					label: "f(x)=x^2",
					points: [
						{ x: 0, y: 0 },
						{ x: 1, y: 1 },
					],
				},
			],
			axes: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
			showGrid: true,
		};
		expect(data.functions).toHaveLength(1);
	});

	test("maps node-flow to NodeFlowData", () => {
		const data: DiagramDataMap["node-flow"] = {
			nodes: [{ id: "n1", label: "Start" }],
			edges: [{ id: "e1", source: "n1", target: "n2" }],
		};
		expect(data.nodes[0].id).toBe("n1");
	});

	test("maps node type to NodeFlowData", () => {
		const data: DiagramDataMap["node"] = {
			nodes: [{ id: "n1" }],
			edges: [],
		};
		expect(data.nodes).toHaveLength(1);
	});

	test("maps custom-svg to CustomSvgData", () => {
		const data: DiagramDataMap["custom-svg"] = {
			svg: "<svg viewBox='0 0 100 100'><circle/></svg>",
		};
		expect(data.svg).toContain("<svg");
	});
});

describe("STEM_SUBJECTS", () => {
	test("includes key STEM subjects", () => {
		expect(STEM_SUBJECTS.has("mathematics")).toBe(true);
		expect(STEM_SUBJECTS.has("physical-sciences")).toBe(true);
		expect(STEM_SUBJECTS.has("life-sciences")).toBe(true);
		expect(STEM_SUBJECTS.has("geography")).toBe(true);
		expect(STEM_SUBJECTS.has("accounting")).toBe(true);
	});

	test("excludes non-STEM subjects", () => {
		expect(STEM_SUBJECTS.has("english")).toBe(false);
		expect(STEM_SUBJECTS.has("history")).toBe(false);
	});

	test("has at least 20 subjects", () => {
		expect(STEM_SUBJECTS.size).toBeGreaterThanOrEqual(20);
	});
});
