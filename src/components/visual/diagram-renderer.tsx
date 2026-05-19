"use client";

import dynamic from "next/dynamic";

const ForceVectorDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/force-vector").then((m) => ({
			default: m.ForceVectorDiagram,
		})),
	{ ssr: false },
);

const CircuitDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/circuit").then((m) => ({
			default: m.CircuitDiagram,
		})),
	{ ssr: false },
);

const WaveDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/wave").then((m) => ({
			default: m.WaveDiagram,
		})),
	{ ssr: false },
);

const MotionDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/motion").then((m) => ({
			default: m.MotionDiagram,
		})),
	{ ssr: false },
);

const GeometryDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/geometry").then((m) => ({
			default: m.GeometryDiagram,
		})),
	{ ssr: false },
);

const ChartDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/chart").then((m) => ({
			default: m.ChartDiagram,
		})),
	{ ssr: false },
);

const ChemistryDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/chemistry").then((m) => ({
			default: m.ChemistryDiagram,
		})),
	{ ssr: false },
);

const GraphDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/graph").then((m) => ({
			default: m.GraphDiagram,
		})),
	{ ssr: false },
);

const ReactFlowDiagram = dynamic(() => import("./reactflow-diagram"), {
	ssr: false,
});

interface DiagramRendererProps {
	type: string;
	data: Record<string, unknown>;
}

export function DiagramRenderer({ type, data }: DiagramRendererProps) {
	switch (type) {
		case "force-vector":
			return <ForceVectorDiagram data={data as never} />;
		case "circuit":
			return <CircuitDiagram data={data as never} />;
		case "wave":
			return <WaveDiagram data={data as never} />;
		case "motion":
			return <MotionDiagram data={data as never} />;
		case "geometry":
			return <GeometryDiagram data={data as never} />;
		case "chart":
			return <ChartDiagram data={data as never} />;
		case "chemistry":
			return <ChemistryDiagram data={data as never} />;
		case "graph":
			return <GraphDiagram data={data as never} />;
		case "node-flow":
		case "node":
			return <ReactFlowDiagram data={data} />;
		case "custom-svg":
			return <CustomSvgRenderer data={data} />;
		default:
			return (
				<div className="flex h-24 items-center justify-center rounded-lg border bg-muted/10 text-muted-foreground text-xs">
					Unsupported diagram type: {type}
				</div>
			);
	}
}

function sanitizeSvg(svg: string): string {
	return svg
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/on\w+="[^"]*"/gi, "")
		.replace(/on\w+='[^']*'/gi, "")
		.replace(/javascript:/gi, "")
		.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "");
}

function CustomSvgRenderer({ data }: { data: Record<string, unknown> }) {
	const rawSvg = data.svg as string;
	if (!rawSvg) {
		return (
			<div className="flex h-24 items-center justify-center rounded-lg border bg-muted/10 text-muted-foreground text-xs">
				No SVG content
			</div>
		);
	}
	return (
		<div
			className="w-full overflow-auto rounded-lg border bg-background p-4"
			dangerouslySetInnerHTML={{ __html: sanitizeSvg(rawSvg) }}
		/>
	);
}
