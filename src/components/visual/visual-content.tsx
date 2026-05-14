"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { SpinnerGap } from "@phosphor-icons/react";
import type { VisualContent as VisualContentType } from "@/lib/visual-engine/types";
import { DiagramRenderer } from "./diagram-renderer";
import { ImageViewer } from "./image-viewer";
import { MermaidDiagram } from "./mermaid-diagram";

interface VisualContentProps {
	visual: VisualContentType | undefined | null;
	isLoading?: boolean;
}

export function VisualContent({ visual, isLoading }: VisualContentProps) {
	const shouldReduceMotion = useReducedMotion();

	if (isLoading) {
		return (
			<div className="flex h-40 items-center justify-center rounded-lg border bg-muted/10">
				{shouldReduceMotion ? (
					<div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
				) : (
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
						className="size-6"
					>
						<SpinnerGap className="size-6 text-muted-foreground" />
					</motion.div>
				)}
			</div>
		);
	}

	if (!visual) return null;

	switch (visual.type) {
		case "konva-diagram":
			if (!visual.diagramType || !visual.diagramData) return null;
			return (
				<div className="flex flex-col gap-1">
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
					sourceUrl={visual.imageUrl}
				/>
			);

		default:
			return null;
	}
}