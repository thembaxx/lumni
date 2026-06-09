"use client";

import { useEffect } from "react";
import { logError } from "@/lib/shared/logger";

const RELOAD_GUARD_KEY = "lumni:chunk-reload-attempt";
const CHUNK_ERROR_PATTERNS = [
	"loading chunk",
	"chunkloaderror",
	"text/plain",
	"failed to fetch dynamically imported module",
	"importing a module script failed",
	"unexpected token '<'",
	"mime type",
];

function isChunkError(message: string): boolean {
	const lower = message.toLowerCase();
	return CHUNK_ERROR_PATTERNS.some((p) => lower.includes(p));
}

async function recoverAndReload() {
	if (typeof window === "undefined") return;

	try {
		const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? "0");
		if (Date.now() - last < 15_000) {
			return;
		}
		sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
	} catch (err) {
		logError("ChunkLoadHandler.sessionStorage", err);
	}

	try {
		if ("caches" in window) {
			const names = await caches.keys();
			await Promise.all(names.map((n) => caches.delete(n)));
		}
	} catch (err) {
		logError("ChunkLoadHandler.cacheClear", err);
	}

	try {
		if ("serviceWorker" in navigator) {
			const regs = await navigator.serviceWorker.getRegistrations();
			await Promise.all(regs.map((r) => r.unregister()));
		}
	} catch (err) {
		logError("ChunkLoadHandler.swUnregister", err);
	}

	window.location.reload();
}

export function ChunkLoadHandler() {
	useEffect(() => {
		function handleError(event: ErrorEvent) {
			const msg = event.message ?? "";
			if (isChunkError(msg)) {
				event.preventDefault();
				void recoverAndReload();
			}
		}

		function handleRejection(event: PromiseRejectionEvent) {
			const reason = event.reason;
			const msg =
				(reason && typeof reason === "object"
					? ((reason as { message?: string; name?: string }).message ??
						(reason as { name?: string }).name ??
						"")
					: String(reason ?? "")) || "";
			if (isChunkError(msg)) {
				event.preventDefault();
				void recoverAndReload();
			}
		}

		window.addEventListener("error", handleError);
		window.addEventListener("unhandledrejection", handleRejection);
		return () => {
			window.removeEventListener("error", handleError);
			window.removeEventListener("unhandledrejection", handleRejection);
		};
	}, []);
	return null;
}
