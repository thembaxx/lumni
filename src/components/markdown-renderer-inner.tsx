"use client";

import { memo, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { KatexCSS } from "@/components/katex-css";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLazySyntaxHighlighter } from "@/lib/shared/lazy-syntax-highlighter";
import { normalizeMathDelimiters } from "@/lib/katex-utils";
import { getSubjectOklchColor } from "@/lib/subjects";
import { cn } from "@/lib/utils";

function LazyCodeBlock({ language, children }: { language: string; children: string }) {
  const { SyntaxHighlighter, style, loaded } = useLazySyntaxHighlighter("dark");

  if (!loaded || !SyntaxHighlighter || !style) {
    return (
      <pre className="my-3 overflow-hidden rounded-lg bg-system-background-tertiary p-4 font-mono text-sm text-system-text-primary">
        <code>{children}</code>
      </pre>
    );
  }
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

interface MarkdownRendererProps {
  content: string;
  className?: string;
  subject?: string;
}

async function loadMathPlugins() {
  const [rk, rm] = await Promise.all([import("rehype-katex"), import("remark-math")]);
  return {
    rehypeKatex: rk.default,
    remarkMath: rm.default,
  };
}

function InlineCode({ className, children, ...props }: React.ComponentPropsWithoutRef<"code">) {
  const match = /language-(\w+)/.exec(className || "");
  if (match) {
    return <LazyCodeBlock language={match[1]}>{String(children).replace(/\n$/, "")}</LazyCodeBlock>;
  }
  return (
    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm" {...props}>
      {children}
    </code>
  );
}

function Paragraph({ children }: { children?: React.ReactNode }) {
  return <p className="mb-3 last:mb-0">{children}</p>;
}

function UnorderedList({ children }: { children?: React.ReactNode }) {
  return <ul className="mb-3 flex list-inside list-disc flex-col gap-1">{children}</ul>;
}

function OrderedList({ children }: { children?: React.ReactNode }) {
  return <ol className="mb-3 flex list-inside list-decimal flex-col gap-1">{children}</ol>;
}

function ListItem({ children }: { children?: React.ReactNode }) {
  return <li className="mb-1">{children}</li>;
}

function BlockQuote({ children }: { children?: React.ReactNode }) {
  return (
    <blockquote className="my-3 border-(--system-accent)/30 border-l-2 pl-4 italic">
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

function MarkdownLink({ href, children }: { href?: string; children?: React.ReactNode }) {
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
  return <Separator className="my-4" />;
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
  const isMathSubject = MATH_SUBJECTS.some((s) => subject?.toLowerCase().includes(s.toLowerCase()));
  const isTabularSubject = TABULAR_SUBJECTS.some((s) =>
    subject?.toLowerCase().includes(s.toLowerCase()),
  );
  const subjectColor = getSubjectOklchColor(subject ?? "");

  const normalizedContent = useMemo(() => normalizeMathDelimiters(content), [content]);
  const hasMath = useMemo(() => MATH_DETECT_RE.test(normalizedContent), [normalizedContent]);

  const needsMath = isMathSubject || hasMath;

  const [mathPlugins, setMathPlugins] = useState<Awaited<
    ReturnType<typeof loadMathPlugins>
  > | null>(null);

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
        "markdown-content overflow-wrap-anywhere",
        isTabularSubject && "tabular-nums",
        className,
      )}
      style={containerStyle}
    >
      {(isMathSubject || hasMath) && <KatexCSS />}
      <ReactMarkdown
        remarkPlugins={
          [remarkGfm, ...(needsMath && mathPlugins ? [mathPlugins.remarkMath] : [])] as const
        }
        rehypePlugins={needsMath && mathPlugins ? ([mathPlugins.rehypeKatex] as const) : []}
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
