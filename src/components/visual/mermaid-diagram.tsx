"use client";

import DOMPurify from "dompurify";
import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  code: string;
  label?: string;
}

type DiagramStatus = "loading" | "ready" | "error";

export function MermaidDiagram({ code, label }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<DiagramStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current) return;

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          fontFamily: "inherit",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, code);

        if (!cancelled && containerRef.current) {
          const sanitized = DOMPurify.sanitize(svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ["style"],
            ADD_ATTR: ["viewBox", "xmlns"],
          });
          containerRef.current.innerHTML = sanitized;
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    render();

    const container = containerRef.current;
    return () => {
      cancelled = true;
      if (container) {
        container.innerHTML = "";
      }
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
        <div
          ref={containerRef}
          className="mermaid-svg-container"
          style={status === "loading" ? { display: "none" } : undefined}
        />
      </div>
    </div>
  );
}
