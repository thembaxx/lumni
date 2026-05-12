"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
	code: string;
	label?: string;
}

export function MermaidDiagram({ code, label }: MermaidDiagramProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function render() {
			if (!containerRef.current) return;

			try {
				const mermaid = (await import("mermaid")).default;
				mermaid.initialize({
					startOnLoad: false,
					theme: "neutral",
					fontFamily: "inherit",
				});

				const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
				const { svg } = await mermaid.render(id, code);

				if (!cancelled && containerRef.current) {
					containerRef.current.innerHTML = svg;
					setLoading(false);
				}
			} catch {
				if (!cancelled) {
					setError(true);
					setLoading(false);
				}
			}
		}

		render();

		return () => {
			cancelled = true;
		};
	}, [code]);

	if (error) {
		return (
			<div className="flex h-32 items-center justify-center rounded-lg border bg-muted/10 text-xs text-muted-foreground">
				Could not render diagram
			</div>
		);
	}

	return (
		<div className="space-y-1">
			{label && (
				<p className="text-xs font-medium text-muted-foreground">{label}</p>
			)}
			<div className="overflow-auto rounded-lg border bg-background/20 p-4">
				{loading && (
					<div className="flex h-32 items-center justify-center">
						<div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
					</div>
				)}
				<div
					ref={containerRef}
					className="mermaid-svg-container"
					style={loading ? { display: "none" } : undefined}
				/>
			</div>
		</div>
	);
}
