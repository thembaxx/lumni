"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { normalizeMathDelimiters } from "@/lib/katex-utils";
import { cn } from "@/lib/utils";

const MATH_SUBJECTS = [
	"mathematics",
	"technical-mathematics",
	"physical-sciences",
	"mathematical-literacy",
];
const TABULAR_SUBJECTS = ["physical-sciences", "mathematical-literacy"];

const MATH_DETECT_RE = /\$\$[\s\S]*?\$\$|\$[a-zA-Z\\{].*?\$|\\\(|\\\[/;

const SUBJECT_COLORS: Record<string, string> = {
	mathematics: "#60a5fa",
	"technical-mathematics": "#c084fc",
	"physical-sciences": "#34d399",
	"mathematical-literacy": "#fb923c",
};

interface MarkdownRendererProps {
	content: string;
	className?: string;
	subject?: string;
}

export function MarkdownRenderer({
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
			<ReactMarkdown
				remarkPlugins={[
					remarkGfm,
					...(isMathSubject || hasMath ? [remarkMath] : []),
				]}
				rehypePlugins={isMathSubject || hasMath ? [rehypeKatex] : []}
				components={{
					code({ className, children, ...props }) {
						const match = /language-(\w+)/.exec(className || "");
						const isInline = !match;

						if (isInline) {
							return (
								<code
									className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-sm"
									{...props}
								>
									{children}
								</code>
							);
						}

						return (
							<SyntaxHighlighter
								style={oneDark}
								language={match[1]}
								PreTag="div"
								className="rounded-lg overflow-hidden my-3"
								customStyle={{
									margin: 0,
									padding: "1rem",
									fontSize: "0.875rem",
								}}
							>
								{String(children).replace(/\n$/, "")}
							</SyntaxHighlighter>
						);
					},
					p({ children }) {
						return <p className="mb-3 last:mb-0">{children}</p>;
					},
					ul({ children }) {
						return (
							<ul className="list-disc list-inside mb-3 space-y-1">
								{children}
							</ul>
						);
					},
					ol({ children }) {
						return (
							<ol className="list-decimal list-inside mb-3 space-y-1">
								{children}
							</ol>
						);
					},
					li({ children }) {
						return <li className="mb-1">{children}</li>;
					},
					blockquote({ children }) {
						return (
							<blockquote className="border-l-4 border-primary/30 pl-4 italic my-3">
								{children}
							</blockquote>
						);
					},
					h1({ children }) {
						return <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>;
					},
					h2({ children }) {
						return <h2 className="text-xl font-bold mb-2 mt-3">{children}</h2>;
					},
					h3({ children }) {
						return (
							<h3 className="text-lg font-semibold mb-2 mt-2">{children}</h3>
						);
					},
					a({ href, children }) {
						return (
							<a
								href={href}
								className="text-primary underline hover:text-primary/80"
								target="_blank"
								rel="noopener noreferrer"
							>
								{children}
							</a>
						);
					},
					table({ children }) {
						return (
							<div className="overflow-x-auto my-3">
								<table className="min-w-full divide-y divide-border border rounded-lg">
									{children}
								</table>
							</div>
						);
					},
					thead({ children }) {
						return <thead className="bg-muted">{children}</thead>;
					},
					th({ children }) {
						return (
							<th className="px-3 py-2 text-left text-sm font-semibold">
								{children}
							</th>
						);
					},
					td({ children }) {
						return (
							<td className="px-3 py-2 text-sm border-t border-border">
								{children}
							</td>
						);
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
}
