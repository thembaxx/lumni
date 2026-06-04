"use client";

import { useEffect, useReducer, useRef } from "react";

interface SafeHTMLProps {
	html: string;
	className?: string;
	as?: "span" | "div";
}

const HAS_HTML_TAGS = /<[a-z][\s\S]*>/i;

let purifyPromise: Promise<{
	default: typeof import("dompurify").default;
}> | null = null;

export function SafeHTML({ html, className, as: Tag = "div" }: SafeHTMLProps) {
	const sanitizedRef = useRef<string | null>(null);
	const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

	if (!HAS_HTML_TAGS.test(html)) {
		sanitizedRef.current = html;
	}

	useEffect(() => {
		if (sanitizedRef.current !== null) return;
		if (!purifyPromise) {
			purifyPromise = import("dompurify");
		}
		let cancelled = false;
		purifyPromise.then(({ default: DOMPurify }) => {
			if (cancelled) return;
			sanitizedRef.current = DOMPurify.sanitize(html, {
				ALLOWED_TAGS: [
					"b",
					"i",
					"em",
					"strong",
					"a",
					"p",
					"br",
					"ul",
					"ol",
					"li",
					"code",
					"pre",
					"span",
					"div",
					"sub",
					"sup",
					"math",
					"mi",
					"mo",
					"mn",
					"msup",
					"msub",
					"mfrac",
					"msqrt",
					"mover",
					"munder",
					"mtable",
					"mtr",
					"mtd",
					"semantics",
					"annotation",
					"svg",
					"path",
					"circle",
					"rect",
					"line",
					"text",
					"g",
					"defs",
				],
				ALLOWED_ATTR: [
					"href",
					"target",
					"rel",
					"class",
					"style",
					"xmlns",
					"viewBox",
					"d",
					"cx",
					"cy",
					"r",
					"x",
					"y",
					"width",
					"height",
					"fill",
					"stroke",
					"stroke-width",
					"transform",
					"id",
					"display",
				],
			});
			forceUpdate();
		});
		return () => {
			cancelled = true;
		};
	}, [html]);

	const displayHtml = sanitizedRef.current ?? "";

	return (
		<Tag
			className={className}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: SafeHTML is a deliberate sanitization boundary — content is tag-free plain text or DOMPurified
			dangerouslySetInnerHTML={{ __html: displayHtml }}
		/>
	);
}
