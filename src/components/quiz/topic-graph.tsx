"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { KnowledgeGraph } from "@/lib/knowledge-graph/types";

interface TopicGraphProps {
	subject: string;
	topic: string;
}

export function TopicGraph({ subject, topic }: TopicGraphProps) {
	const {
		data: graph,
		isPending,
		isError,
		error,
	} = useQuery({
		queryKey: ["knowledge-graph", subject, topic],
		queryFn: async () => {
			const params = new URLSearchParams({ subject, topic });
			const res = await fetch(`/api/engine/knowledge-graph?${params}`);
			if (!res.ok) return null;
			return res.json() as Promise<KnowledgeGraph>;
		},
		enabled: !!subject && !!topic,
	});

	if (isError) {
		return (
			<div className="py-2 text-destructive text-xs">
				Failed to load topic graph: {error?.message}
			</div>
		);
	}

	if (isPending) {
		return (
			<div className="flex items-center gap-2 overflow-x-auto py-2">
				<Skeleton className="h-7 w-24 shrink-0 rounded-full" />
				<Skeleton className="h-7 w-20 shrink-0 rounded-full" />
				<Skeleton className="h-7 w-28 shrink-0 rounded-full" />
				<Skeleton className="h-7 w-24 shrink-0 rounded-full" />
			</div>
		);
	}

	if (!graph || graph.nodes.length === 0) return null;

	const currentTopicNode = graph.nodes.find(
		(n) => n.label.toLowerCase() === topic.toLowerCase() || n.type === "core",
	);

	const prereqs = graph.nodes.filter((n) => n.type === "prerequisite");
	const advanced = graph.nodes.filter((n) => n.type === "advanced");

	const chainNodes = [
		...prereqs.slice(0, 2),
		...(currentTopicNode ? [currentTopicNode] : []),
		...advanced.slice(0, 2),
	];

	if (chainNodes.length < 2) return null;

	return (
		<ul
			className="flex items-center gap-1 overflow-x-auto py-2"
			aria-label="Topic knowledge path"
		>
			{chainNodes.map((node, i) => (
				<li key={node.id} className="flex shrink-0 items-center gap-1">
					<span
						className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 font-medium text-[11px] leading-tight ${
							node.id === currentTopicNode?.id
								? "border-foreground/20 bg-foreground/10 text-foreground"
								: node.type === "prerequisite"
									? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
									: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
						}`}
					>
						{node.label}
					</span>
					{i < chainNodes.length - 1 && (
						<span className="mx-0.5 text-muted-foreground/40">&rarr;</span>
					)}
				</li>
			))}
		</ul>
	);
}
