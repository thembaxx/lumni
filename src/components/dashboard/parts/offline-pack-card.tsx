"use client";

import CloudAlertIcon from "@hugeicons/core-free-icons/CloudAlertIcon";
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon";
import FileDownloadIcon from "@hugeicons/core-free-icons/FileDownloadIcon";
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import Time03Icon from "@hugeicons/core-free-icons/Time03Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuizPack } from "@/lib/quiz-packs";

function formatPackBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: QuizPack["status"] }) {
  switch (status) {
    case "generating":
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-(--system-warning)/30 bg-(--system-warning)/10 text-(--system-warning)"
        >
          <HugeiconsIcon icon={Loading03Icon} className="size-3 animate-spin" />
          Generating
        </Badge>
      );
    case "ready":
      return (
        <Badge className="bg-(--system-accent)/10 text-(--system-accent) hover:bg-(--system-accent)/15">
          Ready
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          <HugeiconsIcon icon={CloudAlertIcon} className="mr-1 size-3" />
          Expired
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="destructive"
          className="bg-(--system-destructive)/10 text-(--system-destructive)"
        >
          Failed
        </Badge>
      );
    default:
      return null;
  }
}

interface OfflinePackCardProps {
  pack: QuizPack;
  onPlay: (id: string) => void;
  onRemove: (id: string) => void;
}

export function OfflinePackCard({ pack, onPlay, onRemove }: OfflinePackCardProps) {
  return (
    <div className="group relative flex flex-col gap-2.5 rounded-card border border-border/60 bg-card p-4 shadow-level-1 transition-shadow duration-300 hover:shadow-level-2 press-scale">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-card bg-(--system-accent)/10">
            <HugeiconsIcon icon={FileDownloadIcon} className="size-4 text-(--system-accent)" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{pack.title}</p>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <span>{pack.questionCount} questions</span>
              <span className="text-border">·</span>
              <span>{formatPackBytes(pack.storageBytes)}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={pack.status} />
      </div>

      {pack.expiresAt && (
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <HugeiconsIcon icon={Time03Icon} className="size-3" />
          <span>
            {pack.status === "expired" ? "Expired " : "Expires "}
            {new Date(pack.expiresAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      )}

      {pack.status === "generating" && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-(--system-accent)" />
        </div>
      )}

      <div className="flex items-center gap-1 pt-0.5">
        {pack.status === "ready" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPlay(pack.id)}
            aria-label={`Play ${pack.title}`}
            className="gap-1.5 text-xs"
          >
            <HugeiconsIcon icon={PlayIcon} data-icon="inline-start" />
            Play
          </Button>
        )}
        {pack.status === "failed" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPlay(pack.id)}
            aria-label={`Retry ${pack.title}`}
            className="gap-1.5 text-xs"
          >
            <HugeiconsIcon icon={RefreshIcon} data-icon="inline-start" />
            Retry
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(pack.id)}
          aria-label={`Delete ${pack.title}`}
          className="ml-auto gap-1.5 text-xs text-muted-foreground hover:text-destructive"
        >
          <HugeiconsIcon icon={Delete02Icon} data-icon="inline-start" />
          Delete
        </Button>
      </div>
    </div>
  );
}
