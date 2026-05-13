"use client";

import {
	ChevronLeft,
	ChevronRight,
	Download,
	FileText,
	Maximize2,
	Minimize,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ExamPaper } from "@/types/exam";

interface PdfViewerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exam: ExamPaper;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.25;

const controlTap =
	"active:not-disabled:scale-[0.96] transition-transform duration-150 ease-out";
const iconTransition =
	"transition-[opacity,filter,scale] duration-300 cubic-bezier(0.2, 0, 0, 1)";

function Spinner({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"w-5 h-5 rounded-full border-2 border-muted border-t-foreground animate-spin",
				className,
			)}
		/>
	);
}

function LoadingOverlay({
	message,
	SpinnerComponent,
}: {
	message: string;
	SpinnerComponent: React.ReactNode;
}) {
	return (
		<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<div className="flex flex-col items-center gap-3">
				{SpinnerComponent}
				<span className="text-xs text-muted-foreground">{message}</span>
			</div>
		</div>
	);
}

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
								SpinnerComponent={<Spinner className="w-6 h-6" />}
							/>
						) : isLoading && !error ? (
							<LoadingOverlay
								message="Loading exam paper..."
								SpinnerComponent={<Spinner className="w-6 h-6" />}
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
							<div className="flex items-center justify-center h-full">
								<div className="text-center">
									<FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
									<p className="text-sm text-muted-foreground">
										PDF unavailable
									</p>
								</div>
							</div>
						)}
						{error && (
							<div className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 backdrop-blur-sm">
								<div className="text-center px-6">
									<FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
									<p className="text-sm font-medium text-foreground">
										Failed to load PDF
									</p>
									<p className="text-xs text-muted-foreground mt-1 max-w-xs">
										{error}
									</p>
								</div>
							</div>
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
								className={cn("h-11 w-11 shrink-0 rounded-full", controlTap)}
								onClick={handlePrevPage}
								disabled={pdfPage <= 1 || totalPages === 0}
								aria-label="Previous page"
							>
								<ChevronLeft className="w-5 h-5" />
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
								className={cn("h-11 w-11 shrink-0 rounded-full", controlTap)}
								onClick={handleNextPage}
								disabled={pdfPage >= totalPages || totalPages === 0}
								aria-label="Next page"
							>
								<ChevronRight className="w-5 h-5" />
							</Button>

							<div className="w-px h-5 bg-border shrink-0" />

							<Button
								variant="ghost"
								size="icon"
								className={cn("h-11 w-11 shrink-0 rounded-full", controlTap)}
								onClick={handleZoomOut}
								disabled={!canZoomOut}
								aria-label="Zoom out"
							>
								<ZoomOut className="w-5 h-5" />
							</Button>

							<div className="shrink-0 px-1 min-w-11 text-center">
								<span className="text-xs text-muted-foreground tabular-nums font-medium">
									{zoomPercent}%
								</span>
							</div>

							<Button
								variant="ghost"
								size="icon"
								className={cn("h-11 w-11 shrink-0 rounded-full", controlTap)}
								onClick={handleZoomIn}
								disabled={!canZoomIn}
								aria-label="Zoom in"
							>
								<ZoomIn className="w-5 h-5" />
							</Button>

							<div className="w-px h-5 bg-border shrink-0" />

							<Button
								variant="ghost"
								size="icon"
								className={cn(
									"h-11 w-11 shrink-0 rounded-full relative",
									controlTap,
								)}
								onClick={toggleFullscreen}
								aria-label={
									isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
								}
							>
								<div className="relative w-5 h-5">
									<div
										className={cn(
											"absolute inset-0 flex items-center justify-center",
											iconTransition,
											isFullscreen
												? "scale-100 opacity-100 blur-0"
												: "scale-[0.25] opacity-0 blur-xs",
										)}
									>
										<Minimize className="w-5 h-5" />
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
										<Maximize2 className="w-5 h-5" />
									</div>
								</div>
							</Button>

							<Button
								variant="ghost"
								size="icon"
								className={cn("h-11 w-11 shrink-0 rounded-full", controlTap)}
								onClick={handleDownload}
								aria-label="Download PDF"
							>
								<Download className="w-5 h-5" />
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
