"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { KatexCSS } from "@/components/katex-css";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { normalizeMathDelimiters } from "@/lib/katex-utils";
import { cn } from "@/lib/shared";

function LazyCodeBlock({
	language,
	children,
}: {
	language: string;
	children: string;
}) {
	const [loaded, setLoaded] = useState(false);
	const modRef = useRef<{
		SyntaxHighlighter: React.ComponentType<Record<string, unknown>>;
		style: Record<string, unknown>;
	} | null>(null);

	useEffect(() => {
		let cancelled = false;
		Promise.all([
			import("react-syntax-highlighter"),
			import("react-syntax-highlighter/dist/esm/styles/prism"),
		]).then(([highlighterMod, styleMod]) => {
			type HighlighterModule = {
				Prism: React.ComponentType<Record<string, unknown>>;
			};
			type StyleModule = { oneDark: Record<string, unknown> };
			const hMod = highlighterMod as unknown as HighlighterModule;
			const sMod = styleMod as unknown as StyleModule;
			if (cancelled) return;
			modRef.current = {
				SyntaxHighlighter: hMod.Prism,
				style: sMod.oneDark,
			};
			setLoaded(true);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	if (!loaded) {
		return (
			<pre className="my-3 overflow-hidden rounded-lg bg-[#1e1e1e] p-4 font-mono text-sm text-white/80">
				<code>{children}</code>
			</pre>
		);
	}

	const { SyntaxHighlighter, style } = modRef.current!;
	return (
		<SyntaxHighlighter
			language={language}
			style={style}
			PreTag="div"
			className="my-3 overflow-hidden rounded-lg"
			customStyle={{ margin: 0, padding: "1rem", fontSize: "0.875rem" }}
		>
			{children}
		</SyntaxHighlighter>
	);
}

const MATH_SUBJECTS = [
	"mathematics",
	"technical-mathematics",
	"physical-sciences",
	"mathematical-literacy",
];
const TABULAR_SUBJECTS = ["physical-sciences", "mathematical-literacy"];

const MATH_DETECT_RE = /\$\$[\s\S]*?\$\$|\$[a-zA-Z\\{].*?\$|\\\(|\\\[/;

const SUBJECT_COLORS: Record<string, string> = {
	mathematics: "oklch(70.6% 0.132 264°)",
	"technical-mathematics": "oklch(71.8% 0.143 286°)",
	"physical-sciences": "oklch(73.6% 0.145 155°)",
	"mathematical-literacy": "oklch(76.2% 0.155 49°)",
};

interface MarkdownRendererProps {
	content: string;
	className?: string;
	subject?: string;
}

async function loadMathPlugins() {
	const [rk, rm] = await Promise.all([
		import("rehype-katex"),
		import("remark-math"),
	]);
	return {
		rehypeKatex: rk.default,
		remarkMath: rm.default,
	};
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
	content,
	className,
	subject,
}: MarkdownRendererProps) {
	const isMathSubject = MATH_SUBJECTS.some((s) =>
		subject?.toLowerCase().includes(s.toLowerCase()),
	);
	const isTabularSubject = TABULAR_SUBJECTS.some((s) =>
		subject?.toLowerCase().includes(s.toLowerCase()),
	);
	const subjectColor = Object.entries(SUBJECT_COLORS).find(([key]) =>
		subject?.toLowerCase().includes(key.toLowerCase()),
	)?.[1];

	const normalizedContent = useMemo(
		() => normalizeMathDelimiters(content),
		[content],
	);
	const hasMath = useMemo(
		() => MATH_DETECT_RE.test(normalizedContent),
		[normalizedContent],
	);

	const needsMath = isMathSubject || hasMath;

	const [mathPlugins, setMathPlugins] = useState<{
		// biome-ignore lint/suspicious/noExplicitAny: dynamic remark/rehype plugin
		rehypeKatex: any;
		// biome-ignore lint/suspicious/noExplicitAny: dynamic remark/rehype plugin
		remarkMath: any;
	} | null>(null);

	useEffect(() => {
		if (!needsMath || mathPlugins) return;
		let cancelled = false;
		loadMathPlugins().then((plugins) => {
			if (cancelled) return;
			setMathPlugins(plugins);
		});
		return () => {
			cancelled = true;
		};
	}, [needsMath, mathPlugins]);

	const containerStyle = subjectColor
		? ({ "--subject-accent": subjectColor } as React.CSSProperties)
		: undefined;

	return (
		<div
			className={cn(
				"markdown-content",
				isTabularSubject && "tabular-nums",
				className,
			)}
			style={containerStyle}
		>
			{(isMathSubject || hasMath) && <KatexCSS />}
			<ReactMarkdown
				remarkPlugins={
					[
						remarkGfm,
						...(needsMath && mathPlugins ? [mathPlugins.remarkMath] : []),
					] as const
				}
				rehypePlugins={
					needsMath && mathPlugins ? ([mathPlugins.rehypeKatex] as const) : []
				}
				components={{
					code({ className, children, ...props }) {
						const match = /language-(\w+)/.exec(className || "");
						const isInline = !match;

						if (isInline) {
							return (
								<code
									className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm"
									{...props}
								>
									{children}
								</code>
							);
						}

						return (
							<LazyCodeBlock language={match[1]}>
								{String(children).replace(/\n$/, "")}
							</LazyCodeBlock>
						);
					},
					p({ children }) {
						return <p className="mb-3 last:mb-0">{children}</p>;
					},
					ul({ children }) {
						return (
							<ul className="mb-3 list-inside list-disc space-y-1">
								{children}
							</ul>
						);
					},
					ol({ children }) {
						return (
							<ol className="mb-3 list-inside list-decimal space-y-1">
								{children}
							</ol>
						);
					},
					li({ children }) {
						return <li className="mb-1">{children}</li>;
					},
					blockquote({ children }) {
						return (
							<blockquote className="my-3 border-[--system-accent]/30 border-l-4 pl-4 italic">
								{children}
							</blockquote>
						);
					},
					h1({ children }) {
						return (
							<h1 className="mt-4 mb-3 font-semibold text-2xl">{children}</h1>
						);
					},
					h2({ children }) {
						return (
							<h2 className="mt-3 mb-2 font-semibold text-xl">{children}</h2>
						);
					},
					h3({ children }) {
						return (
							<h3 className="mt-2 mb-2 font-semibold text-lg">{children}</h3>
						);
					},
					a({ href, children }) {
						return (
							<a
								href={href}
								className="text-foreground underline hover:text-foreground/80"
								target="_blank"
								rel="noopener noreferrer"
							>
								{children}
							</a>
						);
					},
					table({ children }) {
						return (
							<div className="my-3 overflow-x-auto">
								<Table>{children}</Table>
							</div>
						);
					},
					thead({ children }) {
						return <TableHeader>{children}</TableHeader>;
					},
					th({ children }) {
						return <TableHead>{children}</TableHead>;
					},
					tr({ children }) {
						return <TableRow>{children}</TableRow>;
					},
					td({ children }) {
						return <TableCell>{children}</TableCell>;
					},
					tbody({ children }) {
						return <TableBody>{children}</TableBody>;
					},
					hr() {
						return <hr className="my-4 border-border" />;
					},
					strong({ children }) {
						return <strong className="font-semibold">{children}</strong>;
					},
					em({ children }) {
						return <em className="italic">{children}</em>;
					},
					del({ children }) {
						return <del className="line-through opacity-70">{children}</del>;
					},
				}}
			>
				{normalizedContent}
			</ReactMarkdown>
		</div>
	);
});
