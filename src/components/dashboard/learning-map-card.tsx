"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnrolledSubjects } from "@/hooks/use-subjects";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type { KnowledgeGraph } from "@/lib/knowledge-graph/types";

const NODE_COLORS: Record<string, string> = {
	prerequisite: "fill-amber-500 stroke-amber-600",
	core: "fill-blue-500 stroke-blue-600",
	advanced: "fill-emerald-500 stroke-emerald-600",
};

const NODE_TEXT_COLORS: Record<string, string> = {
	prerequisite: "#d97706",
	core: "#2563eb",
	advanced: "#059669",
};

export function LearningMapCard() {
	const { push } = useRouter();
	const { isAnonymous } = useAuth();
	const { enrolledSubjects } = useEnrolledSubjects();
	const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	const fetchGraph = useCallback(async () => {
		if (enrolledSubjects.length === 0) {
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(false);
		try {
			const sub = enrolledSubjects[0];
			const res = await fetch("/api/engine/knowledge-graph", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject: sub.name, topic: sub.name }),
			});
			if (!res.ok) throw new Error("Failed to fetch");
			const data = (await res.json()) as KnowledgeGraph;
			setGraph(data);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [enrolledSubjects]);

	useEffect(() => {
		fetchGraph();
	}, [fetchGraph]);

	if (isAnonymous || enrolledSubjects.length === 0) return null;

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="font-extrabold text-sm tracking-tight">
						Learning Map
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-48 w-full rounded-xl" />
				</CardContent>
			</Card>
		);
	}

	if (error || !graph || graph.nodes.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="font-extrabold text-sm tracking-tight">
						Learning Map
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-xs">Could not load</p>
				</CardContent>
			</Card>
		);
	}

	const layers = {
		prerequisite: graph.nodes.filter((n) => n.type === "prerequisite"),
		core: graph.nodes.filter((n) => n.type === "core"),
		advanced: graph.nodes.filter((n) => n.type === "advanced"),
	};

	const layerKeys = ["prerequisite", "core", "advanced"] as const;
	const maxNodes = Math.max(
		layers.prerequisite.length,
		layers.core.length,
		layers.advanced.length,
		1,
	);

	const nodeW = 100;
	const nodeH = 32;
	const gapX = 20;
	const gapY = 60;
	const padX = 30;
	const padY = 20;
	const svgW = maxNodes * (nodeW + gapX) + padX * 2;
	const svgH = 3 * (nodeH + gapY) + padY * 2;

	function getNodeX(index: number, total: number) {
		const rowWidth = total * (nodeW + gapX) - gapX;
		const startX = (svgW - rowWidth) / 2;
		return startX + index * (nodeW + gapX);
	}

	function getNodeY(rowIndex: number) {
		return padY + rowIndex * (nodeH + gapY);
	}

	function getNodeCenter(rowIndex: number, index: number, total: number) {
		return {
			x: getNodeX(index, total) + nodeW / 2,
			y: getNodeY(rowIndex) + nodeH / 2,
		};
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-extrabold text-sm tracking-tight">
					Learning Map
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<svg
						viewBox={`0 0 ${svgW} ${svgH}`}
						className="w-full max-w-full"
						style={{ minWidth: svgW, minHeight: svgH }}
						role="img"
						aria-label="Knowledge graph showing prerequisite, core, and advanced topics"
					>
						{graph.edges.map((edge) => {
							const fromNode = graph.nodes.find((n) => n.id === edge.from);
							const toNode = graph.nodes.find((n) => n.id === edge.to);
							if (!fromNode || !toNode) return null;
							const fromLayer = layerKeys.indexOf(
								fromNode.type as (typeof layerKeys)[number],
							);
							const toLayer = layerKeys.indexOf(
								toNode.type as (typeof layerKeys)[number],
							);
							const fromIdx = layers[fromNode.type].indexOf(fromNode);
							const toIdx = layers[toNode.type].indexOf(toNode);
							const from = getNodeCenter(
								fromLayer,
								fromIdx,
								layers[fromNode.type].length,
							);
							const to = getNodeCenter(
								toLayer,
								toIdx,
								layers[toNode.type].length,
							);
							const midY = (from.y + to.y) / 2;
							const d = `M ${from.x} ${from.y} Q ${from.x} ${midY} ${from.x + (to.x - from.x) / 2} ${midY} T ${to.x} ${to.y}`;
							return (
								<path
									key={edge.from + edge.to}
									d={d}
									fill="none"
									stroke="currentColor"
									className="text-border/60"
									strokeWidth={1.5}
								/>
							);
						})}
						{graph.nodes.map((node) => {
							const rowIndex = layerKeys.indexOf(
								node.type as (typeof layerKeys)[number],
							);
							const row = layers[node.type];
							const nodeIndex = row.indexOf(node);
							const _x = getNodeX(nodeIndex, row.length);
							const _y = getNodeY(rowIndex);
							const _fillClass = NODE_COLORS[node.type] ?? NODE_COLORS.core;
							return (
								<a
									key={node.id}
									className="cursor-pointer"
									tabIndex={0}
									href={`/quiz?subject=${encodeURIComponent(enrolledSubjects[0]?.name ?? "")}&topic=${encodeURIComponent(node.label)}`}
									onKeyDown={(e) => {
										if (
											(e as React.KeyboardEvent).key === "Enter" ||
											(e as React.KeyboardEvent).key === " "
										) {
											push(
												`/quiz?subject=${encodeURIComponent(enrolledSubjects[0]?.name ?? "")}&topic=${encodeURIComponent(node.label)}`,
											);
										}
									}}
								>
									<rect
										x={_x}
										y={_y}
										width={nodeW}
										height={nodeH}
										rx={6}
										className={_fillClass}
										fillOpacity={0.15}
										strokeWidth={1.5}
									/>
									<foreignObject x={_x} y={_y} width={nodeW} height={nodeH}>
										<div className="flex h-full items-center justify-center px-1">
											<span
												className="truncate text-center font-medium text-[10px] leading-tight"
												style={{
													color: NODE_TEXT_COLORS[node.type] ?? "#2563eb",
												}}
											>
												{node.label}
											</span>
										</div>
									</foreignObject>
								</a>
							);
						})}
					</svg>
				</div>
			</CardContent>
		</Card>
	);
}
