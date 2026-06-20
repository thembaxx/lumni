"use client";

import Image from "next/image";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { Equation } from "@/components/ui/equation";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ContentBlock } from "@/types/exam-paper";

interface ContentBlockRendererProps {
	block: ContentBlock;
}

function LazyCodeBlock({
	language,
	value,
}: {
	language?: string;
	value: string;
}) {
	const [loaded, setLoaded] = useState(false);
	const HighlighterRef = useRef<ComponentType<Record<string, unknown>> | null>(
		null,
	);
	const styleRef = useRef<Record<string, unknown> | null>(null);

	useEffect(() => {
		let cancelled = false;
		Promise.all([
			import("react-syntax-highlighter"),
			import("react-syntax-highlighter/dist/esm/styles/prism"),
		]).then(([highlighterMod, styleMod]) => {
			type HighlighterModule = {
				Prism: ComponentType<Record<string, unknown>>;
			};
			type StyleModule = { oneLight: Record<string, unknown> };
			if (cancelled) return;
			HighlighterRef.current = (
				highlighterMod as unknown as HighlighterModule
			).Prism;
			styleRef.current = (styleMod as unknown as StyleModule).oneLight;
			setLoaded(true);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	if (!loaded || !HighlighterRef.current || !styleRef.current) {
		return (
			<pre className="overflow-wrap-anywhere my-3 overflow-hidden rounded border bg-muted p-4 font-mono text-sm">
				<code>{value}</code>
			</pre>
		);
	}

	const Highlighter = HighlighterRef.current;
	return (
		<Highlighter
			language={language || "text"}
			style={styleRef.current}
			customStyle={{ margin: 0, fontSize: "0.8rem" }}
		>
			{value}
		</Highlighter>
	);
}

export function ContentBlockRenderer({ block }: ContentBlockRendererProps) {
	switch (block.type) {
		case "text":
			return (
				<p className="overflow-wrap-anywhere whitespace-pre-wrap text-sm leading-relaxed">
					{block.value}
				</p>
			);

		case "image":
			if (!block.imagePath) return null;
			return (
				<div className="my-3">
					<Image
						src={block.imagePath}
						alt={block.altText || ""}
						width={800}
						height={600}
						sizes="(max-width: 768px) 100vw, 800px"
						className="h-auto max-w-full rounded border outline outline-black/10 -outline-offset-1 dark:outline-white/10"
					/>
					{block.altText && (
						<p className="mt-1 text-muted-foreground text-xs">
							{block.altText}
						</p>
					)}
				</div>
			);

		case "table": {
			if (!block.tableData) return null;
			const { headers, rows } = block.tableData;
			return (
				<div className="my-3 overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								{headers.map((h, _i) => (
									<TableHead key={`hdr-${h}`}>{h}</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => {
								const rowKey = row.join("|");
								return (
									<TableRow key={`trow-${rowKey}`}>
										{row.map((cell) => {
											const cellText =
												cell !== null && cell !== undefined ? String(cell) : "";
											return (
												<TableCell key={`tcell-${rowKey}-${cellText}`}>
													{cellText}
												</TableCell>
											);
										})}
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			);
		}

		case "formula":
			return block.value ? (
				<div className="my-3 flex justify-center">
					<Equation math={block.value} block />
				</div>
			) : null;

		case "code":
			return block.value ? (
				<div className="my-3 overflow-hidden rounded border">
					<LazyCodeBlock language={block.language} value={block.value} />
				</div>
			) : null;

		default:
			return null;
	}
}
