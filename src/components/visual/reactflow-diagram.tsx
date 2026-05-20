"use client";

import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";

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
		position: { x: n.x || 0, y: n.y || 0 },
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
		<div className="h-60 w-full overflow-hidden rounded-2xl border bg-background/20">
			<ReactFlow nodes={nodes} edges={edges} fitView>
				<Background />
				<Controls />
				<MiniMap />
			</ReactFlow>
		</div>
	);
}
