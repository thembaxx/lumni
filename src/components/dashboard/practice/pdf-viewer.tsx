"use client";

import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Download01Icon,
	File02Icon,
	ExpandIcon,
	ShrinkDotIcon,
	SearchAddIcon,
	SearchMinusIcon,
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
				className="max-w-[100vw] h-dvh max-h-dvh p-0 gap-0 rounded-none overflow-hidden"
			>
				<div className="flex flex-col h-full w-full">
					<div className="flex items-center gap-2 px-4 py-3 border-b shrink-0 bg-background">
						<h2 className="text-sm font-semibold truncate text-wrap balance">
							{exam.title}
						</h2>
						<Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
							{exam.year}
						</Badge>
					</div>

					<div className="flex-1 overflow-hidden relative min-h-0">
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
							<div className="w-full h-full overflow-auto">
								<div className="min-h-full flex items-start justify-center p-3 sm:p-4">
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
											className="shadow-lg bg-background"
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
							className="flex items-center gap-0.5 px-2 py-2 overflow-x-auto scrollbar-hide [-webkit-overflow-scrolling:touch] scrollbar-none [-ms-overflow-style:none]"
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

							<div className="shrink-0 px-1.5 min-w-14 text-center">
								<span className="text-sm font-medium tabular-nums">
									{totalPages > 0 ? `${pdfPage}` : "—"}
								</span>
								<span className="text-xs text-muted-foreground">
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

							<div className="w-px h-5 bg-border shrink-0" />

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

							<div className="shrink-0 px-1 min-w-11 text-center">
								<span className="text-xs text-muted-foreground tabular-nums font-medium">
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

							<div className="w-px h-5 bg-border shrink-0" />

							<Button
								variant="ghost"
								size="icon"
								className={cn("shrink-0 relative", controlTap)}
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
