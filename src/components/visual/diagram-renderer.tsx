"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { SafeHTML } from "@/components/ui/safe-html";
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

type DiagramComponent = ComponentType<{ data: Record<string, unknown> }>;

const diagramRegistry: Record<string, DiagramComponent> = {
	"force-vector": ForceVectorDiagram as unknown as DiagramComponent,
	circuit: CircuitDiagram as unknown as DiagramComponent,
	wave: WaveDiagram as unknown as DiagramComponent,
	motion: MotionDiagram as unknown as DiagramComponent,
	geometry: GeometryDiagram as unknown as DiagramComponent,
	chart: ChartDiagram as unknown as DiagramComponent,
	chemistry: ChemistryDiagram as unknown as DiagramComponent,
	graph: GraphDiagram as unknown as DiagramComponent,
	"node-flow": ReactFlowDiagram as unknown as DiagramComponent,
	node: ReactFlowDiagram as unknown as DiagramComponent,
	"custom-svg": CustomSvgRenderer as unknown as DiagramComponent,
};

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
	const Component = diagramRegistry[type];
	if (!Component) {
		return (
			<div className="flex h-24 items-center justify-center rounded-lg border bg-muted/10 text-muted-foreground text-xs">
				Unsupported diagram type: {type}
			</div>
		);
	}
	return <Component data={data as never} />;
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
		<SafeHTML
			html={sanitizeSvg(rawSvg)}
			className="w-full overflow-auto rounded-lg border bg-background p-4"
		/>
	);
}
