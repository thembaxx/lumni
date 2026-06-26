"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import Download01Icon from "@hugeicons/core-free-icons/Download01Icon";
import ExpandIcon from "@hugeicons/core-free-icons/ExpandIcon";
import File02Icon from "@hugeicons/core-free-icons/File02Icon";
import SearchAddIcon from "@hugeicons/core-free-icons/SearchAddIcon";
import SearchMinusIcon from "@hugeicons/core-free-icons/SearchMinusIcon";
import ShrinkDotIcon from "@hugeicons/core-free-icons/ShrinkDotIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingOverlay } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { useCachedPdfUrl } from "@/hooks/use-pdf-cache";
import { logError } from "@/lib/shared/logger";
import { cn } from "@/lib/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { PaperListing } from "@/types/exam";

const PdfDocument = dynamic(() => import("react-pdf").then((mod) => ({ default: mod.Document })), {
  ssr: false,
});
const PdfPage = dynamic(() => import("react-pdf").then((mod) => ({ default: mod.Page })), {
  ssr: false,
});

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
      return { pdfPage: 1, totalPages: 0, isLoading: true, error: null, scale: 1 };
    case "PREV_PAGE":
      return { ...state, pdfPage: Math.max(1, state.pdfPage - 1) };
    case "NEXT_PAGE":
      return { ...state, pdfPage: Math.min(state.totalPages, state.pdfPage + 1) };
    case "LOAD_SUCCESS":
      return { ...state, totalPages: action.numPages, isLoading: false };
    case "LOAD_ERROR":
      return { ...state, error: action.message, isLoading: false };
    case "ZOOM_IN":
      return { ...state, scale: Math.min(3, +(state.scale + 0.25).toFixed(2)) };
    case "ZOOM_OUT":
      return { ...state, scale: Math.max(0.5, +(state.scale - 0.25).toFixed(2)) };
  }
}

const initialPdfState: PdfState = {
  pdfPage: 1,
  totalPages: 0,
  isLoading: true,
  error: null,
  scale: 1,
};

async function fetchExamPaper(id: string): Promise<PaperListing> {
  const res = await fetch(`/api/exams?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Failed to fetch exam paper");
  const data = await res.json();
  return {
    id: data.id,
    subject: data.subject,
    subjectId: data.subjectCode ?? data.subject,
    year: data.year,
    session: data.examPeriod?.toLowerCase().includes("nov") ? "november" : "may-june",
    type: data.type ?? "paper",
    paperNumber: data.paperNumber,
    language: data.language?.toLowerCase(),
    title: `${data.subject} ${data.paperCode ?? ""} ${data.year}`.trim(),
    url: data.fileUrl ?? "",
    fileUrl: data.fileUrl,
    src: undefined,
    localPath: undefined,
  };
}

export function PdfPageClient() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const {
    data: exam,
    isLoading: examLoading,
    error: examError,
  } = useQuery({
    queryKey: ["exam-paper-pdf", id],
    queryFn: () => fetchExamPaper(id),
    enabled: !!id,
  });

  const [pdfState, dispatchPdf] = useReducer(pdfReducer, initialPdfState);
  const { pdfPage, totalPages, isLoading: pdfIsLoading, error: pdfError, scale } = pdfState;
  const [workerReady, setWorkerReady] = useState(false);

  useEffect(() => {
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      setWorkerReady(true);
    });
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cachedUrl = useCachedPdfUrl(id);
  const pdfUrl = cachedUrl || exam?.fileUrl || exam?.url;

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    dispatchPdf({ type: "LOAD_SUCCESS", numPages });
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    logError("PdfLoadError", err);
    dispatchPdf({ type: "LOAD_ERROR", message: err?.message ?? "Failed to load PDF" });
  }, []);

  const handleDownload = useCallback(() => {
    if (pdfUrl) window.open(pdfUrl, "_blank");
  }, [pdfUrl]);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  if (examLoading) {
    return <LoadingOverlay message="Loading exam paper…" spinnerSize="lg" />;
  }

  if (examError || !exam) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <EmptyState icon={File02Icon} title="Exam not found" />
      </div>
    );
  }

  const canZoomIn = scale < 3;
  const canZoomOut = scale > 0.5;
  const zoomPercent = Math.round(scale * 100);
  const controlTap = "active:not-disabled:scale-[0.96] transition-transform duration-150 ease-out";
  const iconTransition =
    "transition-[opacity,filter,scale] duration-300 ease-(--ease-ios-decelerate)";

  return (
    <div ref={containerRef} className="flex h-dvh w-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b bg-background px-4 py-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()} aria-label="Go back">
          <HugeiconsIcon icon={ArrowLeft01Icon} />
        </Button>
        <h1 className="balance truncate text-wrap font-semibold text-sm">{exam.title}</h1>
        <Badge variant="secondary" className="shrink-0 px-1.5 text-(--fs-caption-3)">
          {exam.year}
        </Badge>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {!workerReady ? (
          <LoadingOverlay message="Initializing PDF viewer…" spinnerSize="lg" />
        ) : pdfIsLoading && !pdfError ? (
          <LoadingOverlay message="Loading exam paper…" spinnerSize="lg" />
        ) : pdfUrl ? (
          <div className="h-full w-full overflow-auto">
            <div className="flex min-h-full items-start justify-center p-3 sm:p-4">
              <Suspense
                fallback={<LoadingOverlay message="Loading PDF renderer…" spinnerSize="md" />}
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
                    className="bg-background shadow-level-1"
                  />
                </PdfDocument>
              </Suspense>
            </div>
          </div>
        ) : (
          <EmptyState icon={File02Icon} title="PDF unavailable" />
        )}
        {pdfError && (
          <EmptyState icon={File02Icon} title="Failed to load PDF" description={pdfError} overlay />
        )}
      </div>

      <div className="shrink-0 border-t bg-background pb-safe">
        <div
          className="scrollbar-hide scrollbar-none flex items-center gap-0.5 overflow-x-auto p-2"
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
            onClick={() => dispatchPdf({ type: "PREV_PAGE" })}
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
            onClick={() => dispatchPdf({ type: "NEXT_PAGE" })}
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
            onClick={() => dispatchPdf({ type: "ZOOM_OUT" })}
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
            onClick={() => dispatchPdf({ type: "ZOOM_IN" })}
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
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <div className="relative size-5">
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  iconTransition,
                  isFullscreen ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-xs",
                )}
              >
                <HugeiconsIcon icon={ShrinkDotIcon} data-icon />
              </div>
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  iconTransition,
                  isFullscreen ? "scale-[0.25] opacity-0 blur-xs" : "scale-100 opacity-100 blur-0",
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
  );
}
