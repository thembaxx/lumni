"use client";

import { FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { normalizeMathDelimiters } from "@/lib/katex-utils";
import {
	type GetExamMarkdownResult,
	getExamMarkdown,
} from "@/lib/server/exam-markdown";
import { cn } from "@/lib/utils";
import type { ExamPaper } from "@/types/exam";

interface SmartViewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exam: ExamPaper;
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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="max-w-[100vw] h-dvh max-h-dvh p-0 gap-0 rounded-none overflow-hidden"
			>
				<div className="flex flex-col h-full w-full">
					<div className="flex items-center gap-2 px-4 py-3 border-b shrink-0 bg-background">
						<h2 className="text-sm font-semibold truncate text-wrap balance flex-1">
							{exam.title}
						</h2>
						<Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
							{exam.year}
						</Badge>
						{result && result.source !== "error" && (
							<Badge
								variant="outline"
								className="text-[9px] px-1.5 shrink-0 capitalize"
							>
								{result.source}
							</Badge>
						)}
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 shrink-0"
							onClick={handleClose}
						>
							<X className="w-4 h-4" />
						</Button>
					</div>

					<div className="flex-1 overflow-auto min-h-0">
						{loading ? (
							<div className="flex items-center justify-center h-full">
								<div className="flex flex-col items-center gap-3">
									<div className="w-6 h-6 rounded-full border-2 border-muted border-t-foreground animate-spin" />
									<span className="text-xs text-muted-foreground">
										Loading smart view...
									</span>
								</div>
							</div>
						) : result?.source === "error" ? (
							<div className="flex items-center justify-center h-full p-6">
								<div className="text-center max-w-sm">
									<FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
									<p className="text-sm font-medium text-foreground mb-1">
										Failed to load content
									</p>
									<p className="text-xs text-muted-foreground mb-4">
										{result.error || "Unable to convert PDF to markdown"}
									</p>
									<Button variant="outline" size="sm" onClick={handleViewPdf}>
										View Original PDF
									</Button>
								</div>
							</div>
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
							<div className="flex items-center justify-center h-full">
								<div className="text-center">
									<FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
									<p className="text-sm text-muted-foreground">
										No content available
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
