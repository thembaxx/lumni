"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserAnswer } from "@/lib/question-engine/types";

export function DiagramInput({ onGrade }: { onGrade: (answer: UserAnswer) => Promise<void> }) {
  const [diagramMode, setDiagramMode] = useState<"draw" | "upload">("draw");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "var(--system-foreground, #000)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    isDrawingRef.current = true;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submitDiagram = () => {
    if (diagramMode === "draw" && canvasRef.current) {
      onGrade({
        type: "text",
        value: canvasRef.current.toDataURL(),
      });
    } else if (diagramMode === "upload" && uploadedImage) {
      onGrade({
        type: "text",
        value: uploadedImage,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2" role="tablist" aria-label="Diagram input mode">
        <Button
          variant={diagramMode === "draw" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDiagramMode("draw")}
          role="tab"
          tabIndex={0}
          aria-selected={diagramMode === "draw"}
          aria-label="Draw diagram"
        >
          Draw
        </Button>
        <Button
          variant={diagramMode === "upload" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDiagramMode("upload")}
          role="tab"
          tabIndex={0}
          aria-selected={diagramMode === "upload"}
          aria-label="Upload image"
        >
          Upload
        </Button>
      </div>
      {diagramMode === "draw" ? (
        <div className="overflow-hidden rounded-lg border">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="w-full max-w-md cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            aria-label="Draw your diagram"
            role="img"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            aria-label="Upload diagram image"
          />
          {uploadedImage && (
            <Image
              src={uploadedImage}
              alt="Uploaded diagram preview"
              width={448}
              height={320}
              unoptimized
              className="max-w-md rounded-lg border"
            />
          )}
        </div>
      )}
      <div className="flex gap-2">
        {diagramMode === "draw" && (
          <Button variant="outline" size="sm" onClick={clearCanvas} aria-label="Clear canvas">
            Clear
          </Button>
        )}
        <Button
          size="sm"
          onClick={submitDiagram}
          disabled={diagramMode === "upload" && !uploadedImage}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
