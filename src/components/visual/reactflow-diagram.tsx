"use client";

import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface ReactFlowData {
	nodes?: Array<{
		id: string;
		type?: string;
		label: string;
		x?: number;
		y?: number;
	}>;
	edges?: Array<{ id: string; source: string; target: string }>;
}

export default function ReactFlowDiagram({
	data,
}: {
	data: Record<string, unknown>;
}) {
	const flowData = data as ReactFlowData;
	const nodes = (flowData.nodes || []).map((n) => ({
		id: n.id,
		position: { x: n.x || Math.random() * 200, y: n.y || Math.random() * 200 },
		data: { label: n.label },
		type: n.type || "default",
	}));
	const edges = (flowData.edges || []).map((e) => ({
		id: e.id,
		source: e.source,
		target: e.target,
		type: "smoothstep",
	}));

	return (
		<div className="h-60 w-full rounded-2xl border bg-background/20 overflow-hidden">
			<ReactFlow nodes={nodes} edges={edges} fitView>
				<Background />
				<Controls />
				<MiniMap />
			</ReactFlow>
		</div>
	);
}
