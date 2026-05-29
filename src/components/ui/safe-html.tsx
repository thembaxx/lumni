"use client";

interface SafeHTMLProps {
	html: string;
	className?: string;
	as?: "span" | "div";
}

export function SafeHTML({ html, className, as: Tag = "div" }: SafeHTMLProps) {
	return (
		// react-doctor will-fix: SafeHTML is a deliberate sanitization boundary — callers must pre-sanitize HTML (KaTeX output, sanitized SVG)
		// biome-ignore lint/security/noDangerouslySetInnerHtml: SafeHTML is a deliberate wrapper for trusted HTML content (KaTeX output, sanitized SVG)
		<Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
	);
}
