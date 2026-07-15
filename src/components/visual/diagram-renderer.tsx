"use client";

import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { diagramRegistry } from "@/components/quiz/diagrams/diagram-registry";

interface DiagramRendererProps {
  type: string;
  data: Record<string, unknown>;
}

export function DiagramRenderer({ type, data }: DiagramRendererProps) {
  return (
    <AppErrorBoundary>
      <DiagramRendererInner type={type} data={data} />
    </AppErrorBoundary>
  );
}

function DiagramRendererInner({ type, data }: DiagramRendererProps) {
  const Component = diagramRegistry[type];
  if (!Component) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border bg-muted/10 text-muted-foreground text-xs">
        Unsupported diagram type: {type}
      </div>
    );
  }
  return <Component data={data} />;
}
