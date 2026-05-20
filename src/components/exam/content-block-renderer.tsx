"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
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

export function ContentBlockRenderer({ block }: ContentBlockRendererProps) {
	switch (block.type) {
		case "text":
			return (
				<p className="whitespace-pre-wrap text-sm leading-relaxed">
					{block.value}
				</p>
			);

		case "image":
			return (
				<div className="my-3">
					<img
						src={block.imagePath}
						alt={block.altText || ""}
						width={800}
						height={600}
						loading="lazy"
						className="h-auto max-w-full rounded border"
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
							{rows.map((row, ri) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: table rows are positional
								<TableRow key={ri}>
									{row.map((cell, ci) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: table cells are positional
										<TableCell key={ci}>
											{cell !== null && cell !== undefined ? String(cell) : ""}
										</TableCell>
									))}
								</TableRow>
							))}
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
					<SyntaxHighlighter
						language={block.language || "text"}
						style={oneLight}
						customStyle={{ margin: 0, fontSize: "0.8rem" }}
					>
						{block.value}
					</SyntaxHighlighter>
				</div>
			) : null;

		default:
			return null;
	}
}
