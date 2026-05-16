"use client";

import { FileText } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { EmptyState } from "@/components/shared/empty-state";
import { FullscreenDialog } from "@/components/shared/fullscreen-dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { normalizeMathDelimiters } from "@/lib/katex-utils";
import {
	type GetExamMarkdownResult,
	getExamMarkdown,
} from "@/lib/server/exam-markdown";
import type { PaperListing } from "@/types/exam";

interface SmartViewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exam: PaperListing;
	onViewPdf?: () => void;
}

export function SmartViewDialog({
	open,
	onOpenChange,
	exam,
	onViewPdf,
}: SmartViewDialogProps) {
	const [loading, setLoading] = useState(true);
	const [result, setResult] = useState<GetExamMarkdownResult | null>(null);

	useEffect(() => {
		if (open && exam.fileUrl) {
			setLoading(true);
			setResult(null);

			getExamMarkdown(exam.fileUrl).then((res) => {
				setResult(res);
				setLoading(false);
			});
		} else if (!open) {
			setLoading(true);
			setResult(null);
		}
	}, [open, exam.fileUrl]);

	const handleClose = () => {
		onOpenChange(false);
	};

	const handleViewPdf = () => {
		handleClose();
		onViewPdf?.();
	};

	return (
		<FullscreenDialog
			open={open}
			onOpenChange={onOpenChange}
			title={exam.title}
			badge={exam.year}
			headerChildren={
				result && result.source !== "error" ? (
					<Badge
						variant="outline"
						className="text-[9px] px-1.5 shrink-0 capitalize"
					>
						{result.source}
					</Badge>
				) : undefined
			}
		>
			<div className="flex-1 overflow-auto min-h-0">
				{loading ? (
					<div className="flex items-center justify-center h-full">
						<div className="flex flex-col items-center gap-3">
							<LoadingSpinner size="lg" />
							<span className="text-xs text-muted-foreground">
								Loading smart view...
							</span>
						</div>
					</div>
				) : result?.source === "error" ? (
					<EmptyState
						icon={FileText}
						title="Failed to load content"
						description={result.error || "Unable to convert PDF to markdown"}
						action={
							<Button variant="outline" size="sm" onClick={handleViewPdf}>
								View Original PDF
							</Button>
						}
					/>
				) : result?.content ? (
					<div className="p-4 sm:p-6">
						<div className="prose prose-sm sm:prose max-w-none dark:prose-invert">
							<ReactMarkdown
								remarkPlugins={[remarkGfm, remarkMath]}
								rehypePlugins={[rehypeKatex]}
							>
								{normalizeMathDelimiters(result.content)}
							</ReactMarkdown>
						</div>
					</div>
				) : (
					<EmptyState icon={FileText} title="No content available" />
				)}
			</div>
		</FullscreenDialog>
	);
}
