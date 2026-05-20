"use client";

import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Download01Icon,
	ExpandIcon,
	File02Icon,
	SearchAddIcon,
	SearchMinusIcon,
	ShrinkDotIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingOverlay } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/shared";
import type { PaperListing } from "@/types/exam";

interface PdfViewerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exam: PaperListing;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.25;

const controlTap =
	"active:not-disabled:scale-[0.96] transition-transform duration-150 ease-out";
const iconTransition =
	"transition-[opacity,filter,scale] duration-300 cubic-bezier(0.2, 0, 0, 1)";

export function PdfViewerImpl({ open, onOpenChange, exam }: PdfViewerProps) {
	const [pdfPage, setPdfPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [workerReady, setWorkerReady] = useState(false);
	const [scale, setScale] = useState(1);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const initRef = useRef(false);

	const pdfUrl = exam.fileUrl || exam.src || exam.localPath || exam.url;

	useEffect(() => {
		if (initRef.current) return;
		initRef.current = true;
		pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
		setWorkerReady(true);
	}, []);

	useEffect(() => {
		if (!open) {
			setPdfPage(1);
			setTotalPages(0);
			setIsLoading(true);
			setError(null);
			setScale(1);
		}
	}, [open]);

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};
		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () =>
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
	}, []);

	const handlePrevPage = useCallback(
		() => setPdfPage((p) => Math.max(1, p - 1)),
		[],
	);
	const handleNextPage = useCallback(
		() => setPdfPage((p) => Math.min(totalPages, p + 1)),
		[totalPages],
	);

	const handleZoomIn = useCallback(
		() => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2))),
		[],
	);
	const handleZoomOut = useCallback(
		() => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2))),
		[],
	);

	const handleDownload = useCallback(() => {
		if (pdfUrl) {
			window.open(pdfUrl, "_blank");
		}
	}, [pdfUrl]);

	const toggleFullscreen = useCallback(async () => {
		if (!document.fullscreenElement) {
			await containerRef.current?.requestFullscreen();
		} else {
			await document.exitFullscreen();
		}
	}, []);

	const onDocumentLoadSuccess = useCallback(
		({ numPages }: { numPages: number }) => {
			setTotalPages(numPages);
			setIsLoading(false);
		},
		[],
	);

	const onDocumentLoadError = useCallback((err: Error) => {
		console.error("PDF load error:", err);
		setError(err.message);
		setIsLoading(false);
	}, []);

	const canZoomIn = scale < MAX_SCALE;
	const canZoomOut = scale > MIN_SCALE;
	const zoomPercent = Math.round(scale * 100);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				ref={containerRef}
				showCloseButton={false}
				className="h-dvh max-h-dvh max-w-[100vw] gap-0 overflow-hidden rounded-none p-0"
			>
				<div className="flex h-full w-full flex-col">
					<div className="flex shrink-0 items-center gap-2 border-b bg-background px-4 py-3">
						<h2 className="balance truncate text-wrap font-semibold text-sm">
							{exam.title}
						</h2>
						<Badge variant="secondary" className="shrink-0 px-1.5 text-[10px]">
							{exam.year}
						</Badge>
					</div>

					<div className="relative min-h-0 flex-1 overflow-hidden">
						{!workerReady ? (
							<LoadingOverlay
								message="Initializing PDF viewer..."
								spinnerSize="lg"
							/>
						) : isLoading && !error ? (
							<LoadingOverlay
								message="Loading exam paper..."
								spinnerSize="lg"
							/>
						) : pdfUrl ? (
							<div className="h-full w-full overflow-auto">
								<div className="flex min-h-full items-start justify-center p-3 sm:p-4">
									<Document
										file={pdfUrl}
										onLoadSuccess={onDocumentLoadSuccess}
										onLoadError={onDocumentLoadError}
										loading={null}
									>
										<Page
											pageNumber={pdfPage}
											scale={scale}
											renderTextLayer={false}
											renderAnnotationLayer={false}
											className="bg-background shadow-lg"
										/>
									</Document>
								</div>
							</div>
						) : (
							<EmptyState icon={File02Icon} title="PDF unavailable" />
						)}
						{error && (
							<EmptyState
								icon={File02Icon}
								title="Failed to load PDF"
								description={error}
								overlay
							/>
						)}
					</div>

					<div className="shrink-0 border-t bg-background pb-safe">
						<div
							className="scrollbar-hide scrollbar-none flex items-center gap-0.5 overflow-x-auto p-2 [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
							style={
								{
									scrollbarWidth: "none",
									WebkitOverflowScrolling: "touch",
								} as React.CSSProperties
							}
						>
							<Button
								variant="ghost"
								size="icon"
								className={cn("shrink-0", controlTap)}
								onClick={handlePrevPage}
								disabled={pdfPage <= 1 || totalPages === 0}
								aria-label="Previous page"
							>
								<HugeiconsIcon icon={ArrowLeft01Icon} data-icon />
							</Button>

							<div className="min-w-14 shrink-0 px-1.5 text-center">
								<span className="font-medium text-sm tabular-nums">
									{totalPages > 0 ? `${pdfPage}` : "—"}
								</span>
								<span className="text-muted-foreground text-xs">
									{" / "}
									{totalPages > 0 ? `${totalPages}` : "—"}
								</span>
							</div>

							<Button
								variant="ghost"
								size="icon"
								className={cn("shrink-0", controlTap)}
								onClick={handleNextPage}
								disabled={pdfPage >= totalPages || totalPages === 0}
								aria-label="Next page"
							>
								<HugeiconsIcon icon={ArrowRight01Icon} data-icon />
							</Button>

							<div className="h-5 w-px shrink-0 bg-border" />

							<Button
								variant="ghost"
								size="icon"
								className={cn("shrink-0", controlTap)}
								onClick={handleZoomOut}
								disabled={!canZoomOut}
								aria-label="Zoom out"
							>
								<HugeiconsIcon icon={SearchMinusIcon} data-icon />
							</Button>

							<div className="min-w-11 shrink-0 px-1 text-center">
								<span className="font-medium text-muted-foreground text-xs tabular-nums">
									{zoomPercent}%
								</span>
							</div>

							<Button
								variant="ghost"
								size="icon"
								className={cn("shrink-0", controlTap)}
								onClick={handleZoomIn}
								disabled={!canZoomIn}
								aria-label="Zoom in"
							>
								<HugeiconsIcon icon={SearchAddIcon} data-icon />
							</Button>

							<div className="h-5 w-px shrink-0 bg-border" />

							<Button
								variant="ghost"
								size="icon"
								className={cn("relative shrink-0", controlTap)}
								onClick={toggleFullscreen}
								aria-label={
									isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
								}
							>
								<div className="relative size-5">
									<div
										className={cn(
											"absolute inset-0 flex items-center justify-center",
											iconTransition,
											isFullscreen
												? "scale-100 opacity-100 blur-0"
												: "scale-[0.25] opacity-0 blur-xs",
										)}
									>
										<HugeiconsIcon icon={ShrinkDotIcon} data-icon />
									</div>
									<div
										className={cn(
											"absolute inset-0 flex items-center justify-center",
											iconTransition,
											isFullscreen
												? "scale-[0.25] opacity-0 blur-xs"
												: "scale-100 opacity-100 blur-0",
										)}
									>
										<HugeiconsIcon icon={ExpandIcon} data-icon />
									</div>
								</div>
							</Button>

							<Button
								variant="ghost"
								size="icon"
								className={cn("shrink-0", controlTap)}
								onClick={handleDownload}
								aria-label="Download PDF"
							>
								<HugeiconsIcon icon={Download01Icon} data-icon />
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
