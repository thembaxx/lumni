"use client";

import { useEffect, useRef } from "react";

const STYLES_ID = "katex-css";

export function KatexCSS() {
	const added = useRef(false);

	useEffect(() => {
		if (added.current) return;
		added.current = true;

		if (typeof document === "undefined") return;
		if (document.getElementById(STYLES_ID)) return;

		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.46/dist/katex.min.css";
		link.id = STYLES_ID;
		document.head.appendChild(link);
	}, []);

	return null;
}
