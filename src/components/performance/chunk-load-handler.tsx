"use client";

import { useEffect } from "react";

export function ChunkLoadHandler() {
	useEffect(() => {
		function handleError(event: ErrorEvent) {
			const msg = event.message ?? "";
			if (
				msg.includes("loading chunk") ||
				msg.includes("ChunkLoadError") ||
				msg.includes("text/plain")
			) {
				event.preventDefault();
				window.location.reload();
			}
		}
		window.addEventListener("error", handleError);
		return () => window.removeEventListener("error", handleError);
	}, []);
	return null;
}
