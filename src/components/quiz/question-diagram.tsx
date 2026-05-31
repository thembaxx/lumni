"use client";

import dynamic from "next/dynamic";
import { CardSkeleton } from "@/components/ui/skeletons";
import type { DiagramSpec } from "@/lib/question-engine/types";

const DiagramRenderer = dynamic(
	() =>
		import("@/components/visual/diagram-renderer").then((m) => ({
			default: m.DiagramRenderer,
		})),
	{ ssr: false, loading: () => <CardSkeleton /> },
);

export function QuestionDiagram({ diagram }: { diagram: DiagramSpec }) {
	return (
		<DiagramRenderer
			type={diagram.type}
			data={diagram.data as Record<string, unknown>}
		/>
	);
}
