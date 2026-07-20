"use client";

import { useCallback, useEffect, useState } from "react";
import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import type { CachedPdf } from "@/lib/db/types";

async function cachePdf(paperId: string, pdfData: Blob, fileName: string): Promise<void> {
  const existing = await dexieDataAccess.cachedPdfs.where("paperId").equals(paperId).first();
  const entry: CachedPdf = { paperId, pdfData, fileName, cachedAt: Date.now() };
  if (existing?.id != null) {
    await dexieDataAccess.cachedPdfs.update(existing.id, entry);
  } else {
    await dexieDataAccess.cachedPdfs.add(entry);
  }
}

async function getCachedPdfUrl(paperId: string): Promise<string | null> {
  const entry = await dexieDataAccess.cachedPdfs.where("paperId").equals(paperId).first();
  if (!entry) return null;
  return URL.createObjectURL(entry.pdfData);
}

async function isPdfCached(paperId: string): Promise<boolean> {
  const entry = await dexieDataAccess.cachedPdfs.where("paperId").equals(paperId).first();
  return !!entry;
}

async function removeCachedPdf(paperId: string): Promise<void> {
  await dexieDataAccess.cachedPdfs.where("paperId").equals(paperId).delete();
}

export function usePdfCache(paperId: string) {
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    isPdfCached(paperId).then(setCached);
  }, [paperId]);

  const download = useCallback(
    async (pdfUrl: string, fileName: string) => {
      setDownloading(true);
      try {
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        await cachePdf(paperId, blob, fileName);
        setCached(true);
      } finally {
        setDownloading(false);
      }
    },
    [paperId],
  );

  const remove = useCallback(async () => {
    await removeCachedPdf(paperId);
    setCached(false);
  }, [paperId]);

  return { cached, downloading, download, remove };
}

export function useCachedPdfUrl(paperId: string | undefined) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!paperId) return;
    let cancelled = false;
    getCachedPdfUrl(paperId).then((url) => {
      if (!cancelled) setBlobUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [paperId]);

  return blobUrl;
}
