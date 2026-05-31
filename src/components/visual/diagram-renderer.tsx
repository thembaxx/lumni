"use client";

import dynamic from "next/dynamic";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";

const diaLoading = () => <Skeleton className="h-48 w-full rounded-lg" />;

const ForceVectorDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/force-vector").then((m) => ({
			default: m.ForceVectorDiagram,
		})),
	{ ssr: false, loading: diaLoading },
);

const CircuitDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/circuit").then((m) => ({
			default: m.CircuitDiagram,
		})),
	{ ssr: false, loading: diaLoading },
);

const WaveDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/wave").then((m) => ({
			default: m.WaveDiagram,
		})),
	{ ssr: false, loading: diaLoading },
);

const MotionDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/motion").then((m) => ({
			default: m.MotionDiagram,
		})),
	{ ssr: false, loading: diaLoading },
);

const GeometryDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/geometry").then((m) => ({
			default: m.GeometryDiagram,
		})),
	{ ssr: false, loading: diaLoading },
);

const ChartDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/chart").then((m) => ({
			default: m.ChartDiagram,
		})),
	{ ssr: false, loading: diaLoading },
);

const ChemistryDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/chemistry").then((m) => ({
			default: m.ChemistryDiagram,
		})),
	{ ssr: false, loading: diaLoading },
);

const GraphDiagram = dynamic(
	() =>
		import("@/components/quiz/diagrams/graph").then((m) => ({
			default: m.GraphDiagram,
		})),
	{ ssr: false, loading: diaLoading },
);

const ReactFlowDiagram = dynamic(() => import("./reactflow-diagram"), {
	ssr: false,
	loading: diaLoading,
});

interface DiagramRendererProps {
	type: string;
	data: Record<string, unknown>;
}

export function DiagramRenderer({ type, data }: DiagramRendererProps) {
	return (
		<AppErrorBoundary>
			<DiagramRendererInner type={type} data={data} />
		</AppErrorBoundary>
	);
}

function DiagramRendererInner({ type, data }: DiagramRendererProps) {
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

import { SafeHTML } from "@/components/ui/safe-html";

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
		<SafeHTML
			html={sanitizeSvg(rawSvg)}
			className="w-full overflow-auto rounded-lg border bg-background p-4"
		/>
	);
}
