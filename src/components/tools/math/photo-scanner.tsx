"use client";

import { useState, useRef } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { logError } from "@/lib/shared/logger";
import type { SolverResult } from "@/lib/services/solve-pipeline";

export function MathPhotoScanner() {
  const [input, setInput] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!input.trim() && !imageData) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input.trim() || undefined,
          imageUrl: imageData || undefined,
          subject: "mathematics",
        }),
      });
      if (!res.ok) {
        setError(`Error: ${res.status}`);
        return;
      }
      const data = await res.json();
      setResult(data as SolverResult);
    } catch (err) {
      logError("MathScanner.solve", err);
      setError("Failed to solve. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setError(null);
    setInput("");
    setImageData(null);
  };

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Solution</h1>
          <Button variant="outline" onClick={handleRetry}>
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

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">Photo Math Scanner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Type a math problem or upload a photo to get a step-by-step solution
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your math problem here... e.g. Solve x² + 5x + 6 = 0"
          className="min-h-[120px] w-full rounded-lg border bg-background p-3 text-sm"
          aria-label="Math problem input"
        />

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
            aria-label="Upload math problem image"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            {imageData ? "Change photo" : "Upload photo"}
          </Button>
          {imageData && (
            <button
              type="button"
              onClick={() => setImageData(null)}
              className="text-xs text-destructive"
              aria-label="Remove uploaded image"
            >
              Remove
            </button>
          )}
        </div>

        {imageData && (
          <div className="relative overflow-hidden rounded-lg">
            {/* oxlint-disable-next-line next/no-img-element -- dynamic blob URL, not a static import */}
            <img
              src={imageData}
              alt="Uploaded math problem"
              className="max-h-64 w-full object-contain"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          onClick={handleSolve}
          disabled={loading || (!input.trim() && !imageData)}
          className="w-full"
        >
          {loading ? "Solving..." : "Solve"}
        </Button>
      </div>
    </div>
  );
}
