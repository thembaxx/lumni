"use client";

import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import type { DiagramSpec } from "@/types/questions";
import { ChartDiagram } from "./diagrams/chart";
import { ChemistryDiagram } from "./diagrams/chemistry";
import { CircuitDiagram } from "./diagrams/circuit";
import { ForceVectorDiagram } from "./diagrams/force-vector";
import { GeometryDiagram } from "./diagrams/geometry";
import { GraphDiagram } from "./diagrams/graph";
import { MotionDiagram } from "./diagrams/motion";
import { WaveDiagram } from "./diagrams/wave";

interface NodeDiagramData {
	nodes?: Array<{
		id: string;
		type?: string;
		label: string;
		x?: number;
		y?: number;
	}>;
	edges?: Array<{ id: string; source: string; target: string }>;
}

function NodeDiagramFlow({ data }: { data: NodeDiagramData }) {
	const initialNodes =
		data.nodes?.map((n) => ({
			id: n.id,
			position: {
				x: n.x || 0,
				y: n.y || 0,
			},
			data: { label: n.label },
			type: n.type || "default",
		})) || [];
	const initialEdges =
		data.edges?.map((e) => ({
			id: e.id,
			source: e.source,
			target: e.target,
			type: "smoothstep",
		})) || [];

	return (
		<div className="h-75 w-full rounded-2xl border bg-background/20 overflow-hidden">
			<ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
				<Background />
				<Controls />
				<MiniMap />
			</ReactFlow>
		</div>
	);
}

export function QuestionDiagram({ diagram }: { diagram: DiagramSpec }) {
	if (diagram.type === "node-flow" || diagram.type === "node") {
		return (
			<NodeDiagramFlow
				data={
					diagram.data as {
						nodes?: Array<{
							id: string;
							type?: string;
							label: string;
							x?: number;
							y?: number;
						}>;
						edges?: Array<{ id: string; source: string; target: string }>;
					}
				}
			/>
		);
	}

	return (
		<div className="space-y-2">
			{diagram.type === "force-vector" && (
				<ForceVectorDiagram data={diagram.data as never} />
			)}
			{diagram.type === "circuit" && (
				<CircuitDiagram data={diagram.data as never} />
			)}
			{diagram.type === "wave" && <WaveDiagram data={diagram.data as never} />}
			{diagram.type === "motion" && (
				<MotionDiagram data={diagram.data as never} />
			)}
			{diagram.type === "geometry" && (
				<GeometryDiagram data={diagram.data as never} />
			)}
			{diagram.type === "chart" && (
				<ChartDiagram data={diagram.data as never} />
			)}
			{diagram.type === "chemistry" && (
				<ChemistryDiagram data={diagram.data as never} />
			)}
			{diagram.type === "graph" && (
				<GraphDiagram data={diagram.data as never} />
			)}
			{diagram.type === "custom-svg" &&
				(diagram.data as Record<string, string>).svg && (
					<div
						className="w-full overflow-auto rounded-lg border bg-background p-4"
						dangerouslySetInnerHTML={{
							__html: String((diagram.data as Record<string, string>).svg),
						}}
					/>
				)}
		</div>
	);
}
