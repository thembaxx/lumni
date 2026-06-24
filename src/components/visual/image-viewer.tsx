"use client";

import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useState } from "react";

interface ImageViewerProps {
  url: string;
  label: string;
  attribution?: string;
  sourceUrl?: string;
}

export function ImageViewer({ url, label, attribution, sourceUrl }: ImageViewerProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-muted/20 text-muted-foreground text-sm">
        Could not load image
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-background/20">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
            <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          </div>
        )}
        <Image
          src={url}
          alt={label}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="!relative max-h-96 object-contain outline outline-black/10 -outline-offset-1 dark:outline-white/10"
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          style={loading ? { display: "none" } : undefined}
        />
      </div>
      {attribution && (
        <p className="ios-caption-3 flex items-center gap-1 text-muted-foreground/60">
          <span>{attribution}</span>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 hover:text-muted-foreground"
            >
              <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3" />
            </a>
          )}
        </p>
      )}
    </div>
  );
}
