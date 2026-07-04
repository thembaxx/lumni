"use client";

import DOMPurify from "dompurify";
import { useEffect, useState } from "react";

interface MermaidDiagramProps {
  code: string;
  label?: string;
}

type DiagramStatus = "loading" | "ready" | "error";

export function MermaidDiagram({ code, label }: MermaidDiagramProps) {
  const [status, setStatus] = useState<DiagramStatus>("loading");
  const [svgHtml, setSvgHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          fontFamily: "inherit",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, code);

        if (!cancelled) {
          const sanitized = DOMPurify.sanitize(svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ["style"],
            ADD_ATTR: ["viewBox", "xmlns"],
          });
          setSvgHtml(sanitized);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (status === "error") {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border bg-muted/10 text-muted-foreground text-xs">
        Could not render diagram
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <p className="font-medium text-muted-foreground text-xs">{label}</p>}
      <div className="overflow-auto rounded-lg border bg-background/20 p-4">
        {status === "loading" && (
          <div className="flex h-32 items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          </div>
        )}
        {svgHtml && (
          <div className="mermaid-svg-container" dangerouslySetInnerHTML={{ __html: svgHtml }} />
        )}
      </div>
    </div>
  );
}
