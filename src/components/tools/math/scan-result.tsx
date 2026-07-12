"use client";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SolverResult } from "@/lib/services/solve-pipeline";

interface ScanResultProps {
  result: SolverResult;
  onRetry: () => void;
}

export function ScanResult({ result, onRetry }: ScanResultProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Solution</h1>
        <Button variant="outline" onClick={onRetry}>
          Scan another problem
        </Button>
      </div>
      <Card className="p-4">
        <MarkdownRenderer content={result.solution} subject="mathematics" />
      </Card>
      {result.steps?.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Step-by-step</h2>
          {result.steps.map((step, i) => (
            <Card key={i} className="p-3">
              <p className="mb-1 text-xs text-muted-foreground">Step {i + 1}</p>
              <MarkdownRenderer content={step} subject="mathematics" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
