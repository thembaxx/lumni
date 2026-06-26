"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

interface HotSpotRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HotSpotInputProps {
  imageUrl?: string;
  width: number;
  height: number;
  regions: HotSpotRegion[];
  onSubmit: (regionId: string) => void;
}

export function HotSpotInput({ imageUrl, width, height, regions, onSubmit }: HotSpotInputProps) {
  const t = useTranslations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scaleX = useCallback((v: number) => Math.round((v / width) * 100), [width]);
  const scaleY = useCallback((v: number) => Math.round((v / height) * 100), [height]);

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative mx-auto w-full max-w-lg select-none"
        style={{ aspectRatio: `${width}/${height}` }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Diagram with selectable regions"
            width={width}
            height={height}
            className="h-full w-full rounded-xl border border-border object-contain outline outline-black/10 -outline-offset-1 dark:outline-white/10"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-muted-foreground/30 border-dashed bg-muted/20 text-muted-foreground text-sm">
            Select the correct region
          </div>
        )}

        {regions.map((region) => {
          const isSelected = selectedId === region.id;
          return (
            <button
              type="button"
              key={region.id}
              onClick={() => setSelectedId(region.id)}
              className={`absolute flex cursor-pointer items-center justify-center rounded-lg border-2 text-center font-medium text-xs transition-[border-color,background-color] duration-150 focus-visible:ring-(--system-accent) focus-visible:ring-2 ${
                isSelected
                  ? "border-(--system-accent) bg-(--system-accent-alpha-20) ring-(--system-accent) ring-2"
                  : "border-(--system-accent)/30 hover:bg-(--system-accent-alpha-10)"
              }`}
              style={{
                left: `${scaleX(region.x)}%`,
                top: `${scaleY(region.y)}%`,
                width: `${scaleX(region.width)}%`,
                height: `${scaleY(region.height)}%`,
              }}
              aria-label={`Select region: ${region.label}`}
              title={region.label}
            >
              <span className="px-1 leading-tight">{region.label}</span>
            </button>
          );
        })}
      </div>

      <Button
        onClick={() => {
          if (selectedId) onSubmit(selectedId);
        }}
        disabled={!selectedId}
        className="self-center"
      >
        {t("quiz.submitAnswer")}
      </Button>
    </div>
  );
}
