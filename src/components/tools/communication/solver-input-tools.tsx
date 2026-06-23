"use client";

import Camera01Icon from "@hugeicons/core-free-icons/Camera01Icon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import Image03Icon from "@hugeicons/core-free-icons/Image03Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/lib/uploadthing";

const uploadButtonContent: Record<string, ({ ready }: { ready: boolean }) => React.ReactNode> = {
  button({ ready }: { ready: boolean }) {
    if (ready)
      return (
        <div className="flex items-center gap-2 text-foreground text-sm">
          <HugeiconsIcon icon={Image03Icon} className="size-4" data-icon />
          <span>Upload</span>
        </div>
      );
    return "Working on it…";
  },
};

interface SolverInputToolsProps {
  phase: "input" | "confirm" | "extracting" | "solving" | "result";
  imageUrl: string | null;
  onCameraClick: () => void;
  onRetake: () => void;
  onUploadComplete: (res: { url: string }[]) => void;
  onUploadError: (error: Error) => void;
}

export function SolverInputTools({
  phase,
  imageUrl,
  onCameraClick,
  onRetake,
  onUploadComplete,
  onUploadError,
}: SolverInputToolsProps) {
  const showTools = phase === "input" || phase === "confirm";

  if (!showTools) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-1 gap-2">
        {phase === "input" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onCameraClick}
              className="h-10 gap-2 rounded-xl px-4"
            >
              <HugeiconsIcon icon={Camera01Icon} data-icon />
              <span className="text-sm">Take Photo</span>
            </Button>
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={onUploadComplete}
              onUploadError={onUploadError}
              appearance={{
                button:
                  "bg-system-fill hover:bg-system-fill-secondary text-foreground h-10 px-4 py-2 text-sm border border-border w-full transition-colors rounded-xl",
                allowedContent: "hidden",
              }}
              content={uploadButtonContent}
            />
          </>
        )}
        {phase === "confirm" && imageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetake}
            className="h-10 gap-2 rounded-xl px-4"
          >
            <HugeiconsIcon icon={Camera01Icon} data-icon />
            <span className="text-sm">Retake</span>
          </Button>
        )}
      </div>
      {imageUrl && (
        <div className="group relative size-20 shrink-0 overflow-hidden rounded-xl border-2 border-[--system-accent]/20 shadow-level-2">
          <Image
            src={imageUrl}
            alt="Uploaded problem"
            fill
            sizes="80px"
            className="object-cover outline outline-black/10 -outline-offset-1 transition-transform group-hover:scale-110 dark:outline-white/10"
          />
          <Button
            variant="destructive"
            size="icon-xs"
            onClick={onRetake}
            className="absolute top-1 right-1 size-5"
            aria-label="Remove image"
          >
            <HugeiconsIcon icon={Cancel01Icon} data-icon />
          </Button>
        </div>
      )}
    </div>
  );
}
