"use client";

import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { m, useReducedMotion } from "framer-motion";
import { memo } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import type { VisualContent as VisualContentType } from "@/lib/visual-engine/types";
import { DiagramRenderer } from "./diagram-renderer";
import { ImageViewer } from "./image-viewer";
import { MermaidDiagram } from "./mermaid-diagram";

interface VisualContentProps {
	visual: VisualContentType | undefined | null;
	isLoading?: boolean;
}

export const VisualContent = memo(function VisualContent({
	visual,
	isLoading,
}: VisualContentProps) {
	return (
		<AppErrorBoundary>
			<VisualContentInner visual={visual} isLoading={isLoading} />
		</AppErrorBoundary>
	);
});

function VisualContentInner({ visual, isLoading }: VisualContentProps) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<>
			{isLoading ? (
				<div className="flex h-40 items-center justify-center rounded-lg border bg-muted/10">
					{shouldReduceMotion ? (
						<div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
					) : (
						<m.div
							animate={{ rotate: 360 }}
							transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
							className="size-6"
						>
							<HugeiconsIcon
								icon={RadialIcon}
								className="size-6 text-muted-foreground"
							/>
						</m.div>
					)}
				</div>
			) : !visual ? null : visual.type === "konva-diagram" &&
				visual.diagramType &&
				visual.diagramData ? (
				<div className="flex flex-col gap-1">
					{visual.label && (
						<p className="font-medium text-muted-foreground text-xs">
							{visual.label}
						</p>
					)}
					<DiagramRenderer
						type={visual.diagramType}
						data={visual.diagramData}
					/>
				</div>
			) : visual.type === "mermaid-diagram" && visual.mermaidCode ? (
				<MermaidDiagram code={visual.mermaidCode} label={visual.label} />
			) : visual.type === "image" && visual.imageUrl ? (
				<ImageViewer
					url={visual.imageUrl}
					label={visual.label}
					attribution={visual.attribution}
					sourceUrl={visual.imageUrl}
				/>
			) : null}
		</>
	);
}
