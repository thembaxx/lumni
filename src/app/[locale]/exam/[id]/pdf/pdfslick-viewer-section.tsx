"use client";

import File02Icon from "@hugeicons/core-free-icons/File02Icon";
import LayoutGridIcon from "@hugeicons/core-free-icons/LayoutGridIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { usePDFSlick } from "@pdfslick/react";
import type { TUsePDFSlickStore, PDFSlickThumbProps } from "@pdfslick/react";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import "@pdfslick/react/dist/pdf_viewer.css";
import "./pdfslick-overrides.css";

type Props = {
  pdfUrl: string;
};

function ThumbnailSidebar({
  usePDFSlickStore,
  thumbsRef,
  isOpen,
  PDFSlickThumbnails: Thumbs,
}: {
  usePDFSlickStore: TUsePDFSlickStore;
  thumbsRef: (instance: HTMLElement | null) => void;
  isOpen: boolean;
  PDFSlickThumbnails: typeof import("@pdfslick/react").PDFSlickThumbnails;
}) {
  const pdfSlick = usePDFSlickStore((s) => s.pdfSlick);
  const currentPage = usePDFSlickStore((s) => s.pageNumber);

  return (
    <aside
      className={cn(
        "shrink-0 overflow-hidden border-r bg-background transition-[width] duration-200 ease-(--ease-ios-decelerate)",
        isOpen ? "w-36" : "w-0",
      )}
    >
      <div className="h-full overflow-auto py-2">
        <Thumbs
          thumbsRef={thumbsRef}
          usePDFSlickStore={usePDFSlickStore}
          className="flex flex-col items-center gap-3 px-2"
        >
          {({ pageNumber, width, height, src, pageLabel, loaded }: PDFSlickThumbProps) => (
            <button
              type="button"
              onClick={() => pdfSlick?.gotoPage(pageNumber)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg p-1 transition-colors",
                loaded && pageNumber === currentPage
                  ? "bg-accent ring-1 ring-ring"
                  : "hover:bg-accent/50",
              )}
            >
              <div
                className="overflow-hidden rounded shadow-level-1"
                style={{
                  width: `${Math.round(width * 0.5)}px`,
                  height: `${Math.round(height * 0.5)}px`,
                }}
              >
                {src ? (
                  /* oxlint-disable-next-line no-img-element — blob URLs from PDFSlick */
                  <img
                    src={src}
                    width={width * 0.5}
                    height={height * 0.5}
                    className="block"
                    alt=""
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-(--fs-caption-3) text-muted-foreground">
                    {pageNumber}
                  </div>
                )}
              </div>
              <span className="text-(--fs-caption-3) text-muted-foreground tabular-nums">
                {pageLabel ?? pageNumber}
              </span>
            </button>
          )}
        </Thumbs>
      </div>
    </aside>
  );
}

export default function PDFSlickViewerSection({ pdfUrl }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { viewerRef, thumbsRef, usePDFSlickStore, PDFSlickViewer, PDFSlickThumbnails, error } =
    usePDFSlick(pdfUrl, {
      scaleValue: "page-fit",
    });

  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (error) setLoadError(true);
  }, [error]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const numPages = usePDFSlickStore((s) => s.numPages);
  const pageNumber = usePDFSlickStore((s) => s.pageNumber);

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={File02Icon} title="Failed to load PDF" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <ThumbnailSidebar
        usePDFSlickStore={usePDFSlickStore}
        thumbsRef={thumbsRef}
        isOpen={sidebarOpen}
        PDFSlickThumbnails={PDFSlickThumbnails}
      />
      <div className="relative flex flex-1 flex-col">
        <div className="relative flex-1">
          <PDFSlickViewer
            viewerRef={viewerRef}
            usePDFSlickStore={usePDFSlickStore}
            className="h-full w-full"
          />
        </div>
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-(--fs-caption-3) text-muted-foreground shadow-level-1 backdrop-blur-xs tabular-nums">
          {pageNumber} / {numPages}
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute left-2 top-2 z-40 rounded-md bg-background/80 p-1.5 text-muted-foreground shadow-level-1 backdrop-blur-xs transition-colors hover:bg-accent"
          aria-label={sidebarOpen ? "Hide thumbnails" : "Show thumbnails"}
        >
          <HugeiconsIcon icon={LayoutGridIcon} size={16} />
        </button>
      </div>
    </div>
  );
}
