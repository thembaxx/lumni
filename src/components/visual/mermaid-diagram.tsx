"use client";

import DOMPurify from "dompurify";
import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  code: string;
  label?: string;
}

type DiagramStatus = "loading" | "ready" | "error";

const svgCache = new Map<string, string>();

export function MermaidDiagram({ code, label }: MermaidDiagramProps) {
  const [status, setStatus] = useState<DiagramStatus>("loading");
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const cached = svgCache.get(code);
    if (cached) {
      setSvgHtml(cached);
      setStatus("ready");
      return;
    }

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          fontFamily: "inherit",
        });

        const id = `mermaid-${code.length}-${code.charCodeAt(0)}`;
        const { svg } = await mermaid.render(id, code);

        if (!cancelledRef.current) {
          const sanitized = DOMPurify.sanitize(svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ["style"],
            ADD_ATTR: ["viewBox", "xmlns"],
          });
          svgCache.set(code, sanitized);
          setSvgHtml(sanitized);
          setStatus("ready");
        }
      } catch {
        if (!cancelledRef.current) {
          setStatus("error");
        }
      }
    }

    render();

    return () => {
      cancelledRef.current = true;
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
