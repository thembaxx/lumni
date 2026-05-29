"use client";

import { File02Icon } from "@hugeicons/core-free-icons";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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
import { getExamMarkdown } from "@/lib/server/exam-markdown";
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
	const { data: result, isLoading: loading } = useQuery({
		queryKey: ["exam-markdown", exam.fileUrl],
		queryFn: () => getExamMarkdown(exam.fileUrl ?? ""),
		enabled: open && !!exam.fileUrl,
		staleTime: 5 * 60 * 1000,
	});

	const handleClose = () => {
		onOpenChange(false);
	};

	const handleViewPdf = () => {
		handleClose();
		onViewPdf?.();
	};

	const headerChildren = useMemo(
		() =>
			result && result.source !== "error" ? (
				<Badge
					variant="outline"
					className="shrink-0 px-1.5 text-[9px] capitalize"
				>
					{result.source}
				</Badge>
			) : undefined,
		[result],
	);

	return (
		<FullscreenDialog
			open={open}
			onOpenChange={onOpenChange}
			title={exam.title}
			badge={exam.year}
			headerChildren={headerChildren}
		>
			<div className="min-h-0 flex-1 overflow-auto">
				{loading ? (
					<div className="flex h-full items-center justify-center">
						<div className="flex flex-col items-center gap-3">
							<LoadingSpinner size="lg" />
							<span className="text-muted-foreground text-xs">
								Loading smart view…
							</span>
						</div>
					</div>
				) : result?.source === "error" ? (
					<EmptyState
						icon={File02Icon}
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
						<div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
							<ReactMarkdown
								remarkPlugins={[remarkGfm, remarkMath]}
								rehypePlugins={[rehypeKatex]}
							>
								{normalizeMathDelimiters(result.content)}
							</ReactMarkdown>
						</div>
					</div>
				) : (
					<EmptyState icon={File02Icon} title="No content available" />
				)}
			</div>
		</FullscreenDialog>
	);
}
