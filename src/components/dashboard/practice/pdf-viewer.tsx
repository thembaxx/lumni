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
import dynamic from "next/dynamic";
import {
	Suspense,
	useCallback,
	useEffect,
	useReducer,
	useRef,
	useState,
} from "react";
import { useCachedPdfUrl } from "@/hooks/use-pdf-cache";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const PdfDocument = dynamic(
	() => import("react-pdf").then((mod) => ({ default: mod.Document })),
	{ ssr: false },
);
const PdfPage = dynamic(
	() => import("react-pdf").then((mod) => ({ default: mod.Page })),
	{ ssr: false },
);

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingOverlay } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/shared";
import { logError } from "@/lib/shared/logger";
import type { PaperListing } from "@/types/exam";

type PdfState = {
	pdfPage: number;
	totalPages: number;
	isLoading: boolean;
	error: string | null;
	scale: number;
};

type PdfAction =
	| { type: "RESET" }
	| { type: "PREV_PAGE" }
	| { type: "NEXT_PAGE" }
	| { type: "LOAD_SUCCESS"; numPages: number }
	| { type: "LOAD_ERROR"; message: string }
	| { type: "ZOOM_IN" }
	| { type: "ZOOM_OUT" };

function pdfReducer(state: PdfState, action: PdfAction): PdfState {
	switch (action.type) {
		case "RESET":
			return {
				pdfPage: 1,
				totalPages: 0,
				isLoading: true,
				error: null,
				scale: 1,
			};
		case "PREV_PAGE":
			return { ...state, pdfPage: Math.max(1, state.pdfPage - 1) };
		case "NEXT_PAGE":
			return {
				...state,
				pdfPage: Math.min(state.totalPages, state.pdfPage + 1),
			};
		case "LOAD_SUCCESS":
			return { ...state, totalPages: action.numPages, isLoading: false };
		case "LOAD_ERROR":
			return { ...state, error: action.message, isLoading: false };
		case "ZOOM_IN":
			return {
				...state,
				scale: Math.min(MAX_SCALE, +(state.scale + SCALE_STEP).toFixed(2)),
			};
		case "ZOOM_OUT":
			return {
				...state,
				scale: Math.max(MIN_SCALE, +(state.scale - SCALE_STEP).toFixed(2)),
			};
	}
}

const initialPdfState: PdfState = {
	pdfPage: 1,
	totalPages: 0,
	isLoading: true,
	error: null,
	scale: 1,
};

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
	const [pdfState, dispatchPdf] = useReducer(pdfReducer, initialPdfState);
	const { pdfPage, totalPages, isLoading, error, scale } = pdfState;
	const [workerReady, setWorkerReady] = useState(false);
	useEffect(() => {
		import("react-pdf").then((mod) => {
			mod.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
			setWorkerReady(true);
		});
	}, []);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const cachedUrl = useCachedPdfUrl(exam.id);
	const pdfUrl =
		cachedUrl || exam.fileUrl || exam.src || exam.localPath || exam.url;

	const handleOpenChange = useCallback(
		(next: boolean) => {
			if (!next) {
				dispatchPdf({ type: "RESET" });
			}
			onOpenChange(next);
		},
		[onOpenChange],
	);

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};
		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () =>
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
	}, []);

	const handlePrevPage = useCallback(
		() => dispatchPdf({ type: "PREV_PAGE" }),
		[],
	);
	const handleNextPage = useCallback(
		() => dispatchPdf({ type: "NEXT_PAGE" }),
		[],
	);

	const handleZoomIn = useCallback(() => dispatchPdf({ type: "ZOOM_IN" }), []);
	const handleZoomOut = useCallback(
		() => dispatchPdf({ type: "ZOOM_OUT" }),
		[],
	);

	const handleDownload = useCallback(() => {
		const downloadUrl = exam.fileUrl || exam.src || exam.url || pdfUrl;
		if (downloadUrl) {
			window.open(downloadUrl, "_blank");
		}
	}, [exam.fileUrl, exam.src, exam.url, pdfUrl]);

	const toggleFullscreen = useCallback(async () => {
		if (!document.fullscreenElement) {
			await containerRef.current?.requestFullscreen();
		} else {
			await document.exitFullscreen();
		}
	}, []);

	const onDocumentLoadSuccess = useCallback(
		({ numPages }: { numPages: number }) => {
			dispatchPdf({ type: "LOAD_SUCCESS", numPages });
		},
		[],
	);

	const onDocumentLoadError = useCallback((err: Error) => {
		logError("PdfLoadError", err);
		dispatchPdf({
			type: "LOAD_ERROR",
			message: err?.message ?? "Failed to load PDF",
		});
	}, []);

	const canZoomIn = scale < MAX_SCALE;
	const canZoomOut = scale > MIN_SCALE;
	const zoomPercent = Math.round(scale * 100);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				ref={containerRef}
				showCloseButton={false}
				className="h-dvh max-h-dvh max-w-[100vw] gap-0 overflow-hidden rounded-none p-0"
			>
				<DialogTitle className="sr-only">{exam.title}</DialogTitle>
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
									<Suspense
										fallback={
											<LoadingOverlay
												message="Loading PDF renderer..."
												spinnerSize="md"
											/>
										}
									>
										<PdfDocument
											file={pdfUrl}
											onLoadSuccess={onDocumentLoadSuccess}
											onLoadError={onDocumentLoadError}
											loading={null}
										>
											<PdfPage
												pageNumber={pdfPage}
												scale={scale}
												renderTextLayer={false}
												renderAnnotationLayer={false}
												className="bg-background shadow-lg"
											/>
										</PdfDocument>
									</Suspense>
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
