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
			<pre className="my-3 overflow-hidden rounded-lg bg-system-background-tertiary p-4 font-mono text-sm text-system-text-primary">
				<code>{children}</code>
			</pre>
		);
	}

	const mod = modRef.current;
	if (!mod) {
		return (
			<pre className="my-3 overflow-hidden rounded-lg bg-system-background-tertiary p-4 font-mono text-sm text-system-text-primary">
				<code>{children}</code>
			</pre>
		);
	}
	const { SyntaxHighlighter, style } = mod;
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

function InlineCode({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<"code">) {
	const match = /language-(\w+)/.exec(className || "");
	if (match) {
		return (
			<LazyCodeBlock language={match[1]}>
				{String(children).replace(/\n$/, "")}
			</LazyCodeBlock>
		);
	}
	return (
		<code
			className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm"
			{...props}
		>
			{children}
		</code>
	);
}

function Paragraph({ children }: { children?: React.ReactNode }) {
	return <p className="mb-3 last:mb-0">{children}</p>;
}

function UnorderedList({ children }: { children?: React.ReactNode }) {
	return (
		<ul className="mb-3 flex list-inside list-disc flex-col gap-1">
			{children}
		</ul>
	);
}

function OrderedList({ children }: { children?: React.ReactNode }) {
	return (
		<ol className="mb-3 flex list-inside list-decimal flex-col gap-1">
			{children}
		</ol>
	);
}

function ListItem({ children }: { children?: React.ReactNode }) {
	return <li className="mb-1">{children}</li>;
}

function BlockQuote({ children }: { children?: React.ReactNode }) {
	return (
		<blockquote className="my-3 border-[--system-accent]/30 border-l-2 pl-4 italic">
			{children}
		</blockquote>
	);
}

function Heading1({ children }: { children?: React.ReactNode }) {
	return <h1 className="mt-4 mb-3 font-semibold text-2xl">{children}</h1>;
}

function Heading2({ children }: { children?: React.ReactNode }) {
	return <h2 className="mt-3 mb-2 font-semibold text-xl">{children}</h2>;
}

function Heading3({ children }: { children?: React.ReactNode }) {
	return <h3 className="mt-2 mb-2 font-semibold text-lg">{children}</h3>;
}

function MarkdownLink({
	href,
	children,
}: {
	href?: string;
	children?: React.ReactNode;
}) {
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
}

function MarkdownTable({ children }: { children?: React.ReactNode }) {
	return (
		<div className="my-3 overflow-x-auto">
			<Table>{children}</Table>
		</div>
	);
}

function MarkdownThead({ children }: { children?: React.ReactNode }) {
	return <TableHeader>{children}</TableHeader>;
}

function MarkdownTh({ children }: { children?: React.ReactNode }) {
	return <TableHead>{children}</TableHead>;
}

function MarkdownTr({ children }: { children?: React.ReactNode }) {
	return <TableRow>{children}</TableRow>;
}

function MarkdownTd({ children }: { children?: React.ReactNode }) {
	return <TableCell>{children}</TableCell>;
}

function MarkdownTbody({ children }: { children?: React.ReactNode }) {
	return <TableBody>{children}</TableBody>;
}

function MarkdownHr() {
	return <hr className="my-4 border-border" />;
}

function MarkdownStrong({ children }: { children?: React.ReactNode }) {
	return <strong className="font-semibold">{children}</strong>;
}

function MarkdownEm({ children }: { children?: React.ReactNode }) {
	return <em className="italic">{children}</em>;
}

function MarkdownDel({ children }: { children?: React.ReactNode }) {
	return <del className="line-through opacity-70">{children}</del>;
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
					code: InlineCode,
					p: Paragraph,
					ul: UnorderedList,
					ol: OrderedList,
					li: ListItem,
					blockquote: BlockQuote,
					h1: Heading1,
					h2: Heading2,
					h3: Heading3,
					a: MarkdownLink,
					table: MarkdownTable,
					thead: MarkdownThead,
					th: MarkdownTh,
					tr: MarkdownTr,
					td: MarkdownTd,
					tbody: MarkdownTbody,
					hr: MarkdownHr,
					strong: MarkdownStrong,
					em: MarkdownEm,
					del: MarkdownDel,
				}}
			>
				{normalizedContent}
			</ReactMarkdown>
		</div>
	);
});
