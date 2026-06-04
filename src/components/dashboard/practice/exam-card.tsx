"use client";

import { CloudDownloadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import { FadeIn } from "@/components/shared/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePdfCache } from "@/hooks/use-pdf-cache";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/shared";
import type { PaperListing } from "@/types/exam";
import { PdfViewer } from "./pdf-viewer-client";
import { SmartViewDialog } from "./smart-view-dialog";

interface ExamCardProps {
	exam: PaperListing;
}

export function ExamCard({ exam }: ExamCardProps) {
	const { push } = useRouter();
	const [pdfOpen, setPdfOpen] = useState(false);
	const [smartViewOpen, setSmartViewOpen] = useState(false);
	const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
	const [practiceDropdownOpen, setPracticeDropdownOpen] = useState(false);
	const viewDropdownRef = useRef<HTMLDivElement>(null);
	const practiceDropdownRef = useRef<HTMLDivElement>(null);
	const { cached, downloading, download, remove } = usePdfCache(exam.id);

	const handleTakeExam = (e: React.MouseEvent) => {
		e.stopPropagation();
		setPracticeDropdownOpen(false);
		push(`/exam/${exam.id}`);
	};

	const handleViewPdf = (e: React.MouseEvent) => {
		e.stopPropagation();
		setViewDropdownOpen(false);
		setPdfOpen(true);
	};

	const handlePractice = (e: React.MouseEvent) => {
		e.stopPropagation();
		setPracticeDropdownOpen(false);
		push(
			`/quiz?subject=${encodeURIComponent(exam.subject ?? exam.title)}&count=10`,
		);
	};

	const handleDownloadPdf = async (e: React.MouseEvent) => {
		e.stopPropagation();
		const pdfUrl = exam.fileUrl || exam.src || exam.url;
		if (!pdfUrl) return;
		if (cached) {
			await remove();
		} else {
			await download(pdfUrl, exam.title);
		}
	};

	return (
		<>
			<FadeIn
				duration={0.25}
				distance={6}
				className="flex w-full flex-col justify-between gap-3 overflow-hidden rounded-xl border-0 bg-secondary/40 p-3 transition-colors hover:bg-secondary/60"
			>
				<div className="min-w-0 flex-1 pr-2">
					<p className="truncate font-medium text-sm">{exam.title}</p>
					<div className="mt-1 flex items-center gap-1.5">
						<span className="text-muted-foreground text-xs">{exam.year}</span>
						<span className="text-muted-foreground/50 text-xs">·</span>
						<Badge
							variant="outline"
							className={cn(
								"ios-caption-3 px-1.5 py-0.5",
								exam.session === "november"
									? "bg-success/15 text-success-foreground"
									: "bg-(--system-accent-alpha-10) text-muted-foreground",
							)}
						>
							{exam.session === "november" ? "Nov" : "May"}
						</Badge>
						{exam.language && (
							<>
								<span className="text-muted-foreground/50 text-xs">·</span>
								<span className="text-muted-foreground text-xs capitalize">
									{exam.language}
								</span>
							</>
						)}
						{cached || exam.downloadedAt ? (
							<Badge
								variant="outline"
								className="ios-caption-3 h-5 px-1.5 text-muted-foreground/70"
							>
								Saved
							</Badge>
						) : null}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-1.5">
					<div ref={viewDropdownRef} className="relative">
						<Button variant="default" size="sm" onClick={handleViewPdf}>
							View
						</Button>
						<Button
							variant="default"
							size="icon-sm"
							className="size-8"
							aria-label="View options"
							onClick={(e) => {
								e.stopPropagation();
								setViewDropdownOpen((o) => !o);
							}}
						>
							<span className="text-xs">▾</span>
						</Button>
						{viewDropdownOpen && (
							<>
								<button
									type="button"
									aria-label="Close menu"
									className="fixed inset-0 z-drawer cursor-default"
									onClick={(e) => {
										e.stopPropagation();
										setViewDropdownOpen(false);
									}}
								/>
								<div className="absolute top-full right-0 z-drawer mt-1 w-36 rounded-lg border border-border bg-card p-1 shadow-level-2">
									<Button
										variant="ghost"
										className="w-full justify-start rounded-md px-3 py-2 text-sm"
										onClick={() => {
											setSmartViewOpen(true);
											setViewDropdownOpen(false);
										}}
									>
										Smart View
									</Button>
								</div>
							</>
						)}
					</div>

					<div ref={practiceDropdownRef} className="relative">
						<Button variant="secondary" size="sm" onClick={handlePractice}>
							Practice
						</Button>
						<Button
							variant="secondary"
							size="icon-sm"
							className="size-8"
							aria-label="Practice options"
							onClick={(e) => {
								e.stopPropagation();
								setPracticeDropdownOpen((o) => !o);
							}}
						>
							<span className="text-xs">▾</span>
						</Button>
						{practiceDropdownOpen && (
							<>
								<button
									type="button"
									aria-label="Close menu"
									className="fixed inset-0 z-drawer cursor-default"
									onClick={(e) => {
										e.stopPropagation();
										setPracticeDropdownOpen(false);
									}}
								/>
								<div className="absolute top-full right-0 z-drawer mt-1 w-36 rounded-lg border border-border bg-card p-1 shadow-level-2">
									<Button
										variant="ghost"
										className="w-full justify-start rounded-md px-3 py-2 text-sm"
										onClick={handleTakeExam}
									>
										Take Exam
									</Button>
								</div>
							</>
						)}
					</div>

					<Button
						variant="ghost"
						size="icon"
						className="size-8"
						onClick={handleDownloadPdf}
						disabled={downloading}
						aria-label={cached ? "Remove offline copy" : "Save for offline"}
					>
						{cached || downloading ? (
							<span
								className={cn(
									"block size-4 rounded-full border-2",
									downloading
										? "animate-spin border-r-transparent"
										: "border-destructive",
								)}
							/>
						) : (
							<HugeiconsIcon icon={CloudDownloadIcon} className="size-4" />
						)}
					</Button>
				</div>
			</FadeIn>

			<PdfViewer open={pdfOpen} onOpenChange={setPdfOpen} exam={exam} />
			<SmartViewDialog
				open={smartViewOpen}
				onOpenChange={setSmartViewOpen}
				exam={exam}
				onViewPdf={() => setPdfOpen(true)}
			/>
		</>
	);
}
