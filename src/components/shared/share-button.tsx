"use client";

import Share08Icon from "@hugeicons/core-free-icons/Share08Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { ShareCardParams } from "@/lib/share/card-generator";
import { generateShareCard } from "@/lib/share/card-generator";
import { logError } from "@/lib/shared/logger";

interface ShareButtonProps {
  cardParams: ShareCardParams;
  text: string;
  onShare?: () => void;
  label?: string;
}

export function ShareResultButton({
  cardParams,
  text,
  onShare,
  label = "Share Result",
}: ShareButtonProps) {
  const [loading, setLoading] = useState(false);

  function handleShare() {
    setLoading(true);
    (async () => {
      let blob: Blob | undefined;
      try {
        blob = await generateShareCard(cardParams);
      } catch (err) {
        logError("ShareCardGenerate", err);
      }

      const shareData: ShareData = { text };

      if (
        blob &&
        navigator.canShare?.({
          files: [new File([blob], "result.png", { type: "image/png" })],
        })
      ) {
        shareData.files = [new File([blob], "result.png", { type: "image/png" })];
      }

      if (navigator.share) {
        await navigator.share(shareData);
        toast({ type: "success", message: "Shared successfully!" });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ type: "success", message: "Copied to clipboard" });
        if (blob) {
          const link = document.createElement("a");
          link.download = `result-${cardParams.type}-${Date.now()}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
          toast({
            type: "success",
            message: "Image downloaded",
            description: "Result card saved as PNG",
          });
        }
      }

      onShare?.();
    })()
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        navigator.clipboard
          .writeText(text)
          .then(() => {
            toast({ type: "success", message: "Copied to clipboard" });
          })
          .catch(() => {
            toast({
              type: "error",
              message: "Sharing failed",
              description: "Could not share or copy to clipboard",
            });
          });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Button variant="outline" onClick={handleShare} disabled={loading} className="gap-2">
      <HugeiconsIcon icon={Share08Icon} data-icon="inline-start" />
      {loading ? "Generating…" : label}
    </Button>
  );
}
