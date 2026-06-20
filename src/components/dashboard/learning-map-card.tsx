"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnrolledSubjects } from "@/hooks/use-subjects";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type {
	KnowledgeGraph,
	KnowledgeNode,
} from "@/lib/knowledge-graph/types";

const NODE_COLORS: Record<string, string> = {
	prerequisite: "fill-amber-500 stroke-amber-600",
	core: "fill-blue-500 stroke-blue-600",
	advanced: "fill-emerald-500 stroke-emerald-600",
};

const LAYER_KEYS = ["prerequisite", "core", "advanced"] as const;

const NODE_TEXT_COLORS: Record<string, string> = {
	prerequisite: "#d97706",
	core: "#2563eb",
	advanced: "#059669",
};

export function LearningMapCard() {
	const { push } = useRouter();
	const { isAnonymous } = useAuth();
	const { enrolledSubjects } = useEnrolledSubjects();

	const subjectForQuery = enrolledSubjects[0]?.name;

	const {
		data: graph,
		isPending,
		isError,
	} = useQuery({
		queryKey: ["knowledge-graph", subjectForQuery],
		queryFn: async () => {
			const params = new URLSearchParams({
				subject: subjectForQuery ?? "",
				topic: subjectForQuery ?? "",
			});
			const res = await fetch(`/api/engine/knowledge-graph?${params}`);
			if (!res.ok) throw new Error("Failed to fetch");
			return res.json() as Promise<KnowledgeGraph>;
		},
		enabled: !!subjectForQuery,
	});

	const { nodeMap, layers } = useMemo(() => {
		const map = new Map<string, KnowledgeNode>();
		const l = {
			prerequisite: [] as KnowledgeNode[],
			core: [] as KnowledgeNode[],
			advanced: [] as KnowledgeNode[],
		};
		if (graph) {
			for (const node of graph.nodes) {
				map.set(node.id, node);
				if (node.type in l) {
					l[node.type as keyof typeof l].push(node);
				}
			}
		}
		return { nodeMap: map, layers: l };
	}, [graph]);

	if (isAnonymous || enrolledSubjects.length === 0) return null;

	if (isPending) {
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

	if (isError || !graph || graph.nodes.length === 0) {
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
							const fromNode = nodeMap.get(edge.from);
							const toNode = nodeMap.get(edge.to);
							if (!fromNode || !toNode) return null;
							const fromType = fromNode.type as keyof typeof layers;
							const toType = toNode.type as keyof typeof layers;
							const fromLayer = LAYER_KEYS.indexOf(
								fromNode.type as (typeof LAYER_KEYS)[number],
							);
							const toLayer = LAYER_KEYS.indexOf(
								toNode.type as (typeof LAYER_KEYS)[number],
							);
							const fromIdx = layers[fromType].indexOf(fromNode);
							const toIdx = layers[toType].indexOf(toNode);
							const from = getNodeCenter(
								fromLayer,
								fromIdx,
								layers[fromType].length,
							);
							const to = getNodeCenter(toLayer, toIdx, layers[toType].length);
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
							const rowIndex = LAYER_KEYS.indexOf(
								node.type as (typeof LAYER_KEYS)[number],
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
