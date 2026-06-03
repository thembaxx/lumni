"use client";

import { useCallback, useEffect, useState } from "react";
import { type ChunkedSearchResult, searchAllChunked } from "@/lib/search";

export function useSearch(query: string, enabled = true) {
	const [results, setResults] = useState<ChunkedSearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const search = useCallback(async (q: string) => {
		if (!q.trim() || q.length < 2) {
			setResults([]);
			return;
		}
		setIsLoading(true);
		try {
			const res = await searchAllChunked(q);
			setResults(res);
		} catch {
			setResults([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!enabled) return;
		const timer = setTimeout(() => search(query), 200);
		return () => clearTimeout(timer);
	}, [query, enabled, search]);

	return { results, isLoading, search };
}
