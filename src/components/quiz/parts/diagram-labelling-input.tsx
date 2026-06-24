"use client";

import { FadeIn } from "@/components/shared/fade-in";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDragSort } from "@/hooks/use-drag-sort";

interface DiagramRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DiagramLabel {
  id: string;
  text: string;
}

interface DiagramLabellingInputProps {
  imageUrl?: string;
  svgContent?: string;
  width: number;
  height: number;
  regions: DiagramRegion[];
  labels: DiagramLabel[];
  onSubmit: (placements: Record<string, string>) => void;
}

export function DiagramLabellingInput({
  imageUrl,
  width,
  height,
  regions,
  labels,
  onSubmit,
}: DiagramLabellingInputProps) {
  const t = useTranslations();
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const { draggedId, handleDragStart, handleDragEnd } = useDragSort();

  const shuffledLabels = useMemo(() => labels.toSorted(() => Math.random() - 0.5), [labels]);

  const unplacedLabels = useMemo(
    () => shuffledLabels.filter((l) => !Object.values(placements).includes(l.id)),
    [shuffledLabels, placements],
  );

  const getLabelForRegion = useCallback(
    (regionId: string) => {
      const labelId = placements[regionId];
      if (!labelId) return null;
      return labels.find((l) => l.id === labelId) ?? null;
    },
    [placements, labels],
  );

  const handleRegionDrop = useCallback(
    (e: React.DragEvent, regionId: string) => {
      e.preventDefault();
      const labelId = e.dataTransfer.getData("text/plain");
      if (!labelId || placements[regionId]) return;

      const otherRegion = Object.entries(placements).find(([, v]) => v === labelId);
      setPlacements((prev) => {
        const next = { ...prev, [regionId]: labelId };
        if (otherRegion) delete next[otherRegion[0]];
        return next;
      });
    },
    [placements],
  );

  const removePlacement = useCallback((regionId: string) => {
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[regionId];
      return next;
    });
  }, []);

  const scaleX = useCallback((regionW: number) => Math.round((regionW / width) * 100), [width]);
  const scaleY = useCallback((regionH: number) => Math.round((regionH / height) * 100), [height]);

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative mx-auto w-full max-w-lg"
        style={{ aspectRatio: `${width}/${height}` }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Diagram to label"
            width={width}
            height={height}
            className="h-full w-full rounded-xl border border-border object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-muted-foreground/30 border-dashed bg-muted/20 text-muted-foreground text-sm">
            Diagram area
          </div>
        )}

        {regions.map((region) => {
          const label = getLabelForRegion(region.id);
          return (
            <button
              type="button"
              key={region.id}
              onDragOver={(e: React.DragEvent) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDragLeave={handleDragEnd}
              onDrop={(e: React.DragEvent) => handleRegionDrop(e, region.id)}
              onClick={() => {
                if (label) removePlacement(region.id);
              }}
              onKeyDown={(e) => {
                if (label && (e.key === "Enter" || e.key === " ")) {
                  removePlacement(region.id);
                }
              }}
              className={`absolute flex cursor-pointer items-center justify-center rounded-lg border-2 text-center font-medium text-xs transition-[border-color,background-color] duration-150 ${
                label
                  ? "border-(--system-accent) bg-(--system-accent-alpha-20)"
                  : "border-(--system-accent)/40 border-dashed hover:bg-(--system-accent-alpha-5)"
              }`}
              style={{
                left: `${scaleX(region.x)}%`,
                top: `${scaleY(region.y)}%`,
                width: `${scaleX(region.width)}%`,
                height: `${scaleY(region.height)}%`,
              }}
              title={region.label}
              aria-label={
                label
                  ? `Region labelled: ${label.text}. Click to remove.`
                  : `Drop a label here for ${region.label}`
              }
            >
              {label ? <span className="px-1 leading-tight">{label.text}</span> : null}
            </button>
          );
        })}
      </div>

      {unplacedLabels.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {unplacedLabels.map((label) => {
            const isDragging = draggedId === label.id;
            return (
              <FadeIn
                direction="scale"
                scaleDistance={0.9}
                key={label.id}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  isDragging ? "opacity-40" : "border-border bg-card"
                }`}
              >
                <button
                  type="button"
                  draggable
                  aria-grabbed={isDragging}
                  onDragStart={(e: React.DragEvent) => handleDragStart(e, label.id)}
                  onDragEnd={handleDragEnd}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                    }
                  }}
                  className="w-full cursor-grab bg-transparent text-left active:cursor-grabbing"
                >
                  {label.text}
                </button>
              </FadeIn>
            );
          })}
        </div>
      )}

      <Button
        onClick={() => {
          const labelPlacements: Record<string, string> = {};
          for (const [regionId, labelId] of Object.entries(placements)) {
            labelPlacements[labelId] = regionId;
          }
          onSubmit(labelPlacements);
        }}
        disabled={Object.keys(placements).length < regions.length}
        className="self-center"
      >
        {t("quiz.submitAnswer")}
      </Button>
    </div>
  );
}
