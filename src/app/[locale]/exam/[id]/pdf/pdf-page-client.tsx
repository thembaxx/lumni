"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import Download01Icon from "@hugeicons/core-free-icons/Download01Icon";
import ExpandIcon from "@hugeicons/core-free-icons/ExpandIcon";
import File02Icon from "@hugeicons/core-free-icons/File02Icon";
import ShrinkDotIcon from "@hugeicons/core-free-icons/ShrinkDotIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingOverlay } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { useCachedPdfUrl } from "@/hooks/use-pdf-cache";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { PaperListing } from "@/types/exam";

const PDFSlickViewerSection = dynamic(() => import("./pdfslick-viewer-section"), { ssr: false });

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

  const cachedUrl = useCachedPdfUrl(id);
  const pdfUrl = cachedUrl || exam?.fileUrl || exam?.url;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
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

      {pdfUrl ? (
        <PDFSlickViewerSection pdfUrl={pdfUrl} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={File02Icon} title="PDF unavailable" />
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-(--z-overlay) flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="size-10 rounded-full shadow-level-1 backdrop-blur-xs"
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
          variant="secondary"
          size="icon"
          className="size-10 rounded-full shadow-level-1 backdrop-blur-xs"
          onClick={handleDownload}
          aria-label="Download PDF"
        >
          <HugeiconsIcon icon={Download01Icon} data-icon />
        </Button>
      </div>
    </div>
  );
}
