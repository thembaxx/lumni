"use client";

import { DiagramRenderer } from "@/components/visual/diagram-renderer";
import type { DiagramSpec } from "@/lib/question-engine/types";

export function QuestionDiagram({ diagram }: { diagram: DiagramSpec }) {
	return (
		<DiagramRenderer
			type={diagram.type}
			data={diagram.data as Record<string, unknown>}
		/>
	);
}
