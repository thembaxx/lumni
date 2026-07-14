"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeMathDelimiters } from "@/lib/katex-utils";

type MarkdownModule = {
  default: typeof import("react-markdown").default;
};
type PluginModule = { default: unknown };

interface Plugins {
  remarkGfm: unknown;
  remarkMath: unknown;
  rehypeKatex: unknown;
}

export function SmartViewMarkdown({ content }: { content: string }) {
  const [mdModule, setMdModule] = useState<MarkdownModule | null>(null);
  const [plugins, setPlugins] = useState<Plugins | null>(null);

  const loadMdPlugins = useCallback(async (signal: { cancelled: boolean }) => {
    const [md, gfm, math, katex] = await Promise.all([
      import("react-markdown"),
      import("remark-gfm"),
      import("remark-math"),
      import("rehype-katex"),
    ]);
    if (signal.cancelled) return;
    setMdModule(md as unknown as MarkdownModule);
    setPlugins({
      remarkGfm: (gfm as PluginModule).default,
      remarkMath: (math as PluginModule).default,
      rehypeKatex: (katex as PluginModule).default,
    });
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    loadMdPlugins(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [loadMdPlugins]);

  if (!mdModule || !plugins) {
    return (
      <div className="whitespace-pre-wrap p-4 font-mono text-muted-foreground text-sm">
        {content}
      </div>
    );
  }

  const ReactMarkdown = mdModule.default;
  return (
    <ReactMarkdown
      remarkPlugins={[plugins.remarkGfm as never, plugins.remarkMath as never]}
      rehypePlugins={[plugins.rehypeKatex as never]}
    >
      {normalizeMathDelimiters(content)}
    </ReactMarkdown>
  );
}
