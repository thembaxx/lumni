"use client";

import { useCallback, useEffect, useState } from "react";
import { pdfCacheRepo } from "@/lib/db/repositories/pdf-cache";

export function usePdfCache(paperId: string) {
	const [cached, setCached] = useState(false);
	const [downloading, setDownloading] = useState(false);

	useEffect(() => {
		pdfCacheRepo.isCached(paperId).then(setCached);
	}, [paperId]);

	const download = useCallback(
		async (pdfUrl: string, fileName: string) => {
			setDownloading(true);
			try {
				const response = await fetch(pdfUrl);
				const blob = await response.blob();
				await pdfCacheRepo.cache(paperId, blob, fileName);
				setCached(true);
			} finally {
				setDownloading(false);
			}
		},
		[paperId],
	);

	const remove = useCallback(async () => {
		await pdfCacheRepo.remove(paperId);
		setCached(false);
	}, [paperId]);

	return { cached, downloading, download, remove };
}

export function useCachedPdfUrl(paperId: string | undefined) {
	const [blobUrl, setBlobUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!paperId) return;
		let cancelled = false;
		pdfCacheRepo.getUrl(paperId).then((url) => {
			if (!cancelled) setBlobUrl(url);
		});
		return () => {
			cancelled = true;
		};
	}, [paperId]);

	return blobUrl;
}
