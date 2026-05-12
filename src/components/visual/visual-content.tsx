"use client";

import type { VisualContent as VisualContentType } from "@/lib/visual-engine/types";
import { DiagramRenderer } from "./diagram-renderer";
import { ImageViewer } from "./image-viewer";
import { MermaidDiagram } from "./mermaid-diagram";

interface VisualContentProps {
	visual: VisualContentType | undefined | null;
	isLoading?: boolean;
}

export function VisualContent({ visual, isLoading }: VisualContentProps) {
	if (isLoading) {
		return (
			<div className="space-y-2">
				<div className="flex h-40 items-center justify-center rounded-lg border bg-muted/10">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
				</div>
				<div className="h-3 w-32 animate-pulse rounded bg-muted/20" />
			</div>
		);
	}

	if (!visual) return null;

	switch (visual.type) {
		case "konva-diagram":
			if (!visual.diagramType || !visual.diagramData) return null;
			return (
				<div className="space-y-1">
					{visual.label && (
						<p className="text-xs font-medium text-muted-foreground">
							{visual.label}
						</p>
					)}
					<DiagramRenderer
						type={visual.diagramType}
						data={visual.diagramData}
					/>
				</div>
			);

		case "mermaid-diagram":
			if (!visual.mermaidCode) return null;
			return <MermaidDiagram code={visual.mermaidCode} label={visual.label} />;

		case "image":
			if (!visual.imageUrl) return null;
			return (
				<ImageViewer
					url={visual.imageUrl}
					label={visual.label}
					attribution={visual.attribution}
					sourceUrl={visual.sourceUrl}
				/>
			);

		default:
			return null;
	}
}
