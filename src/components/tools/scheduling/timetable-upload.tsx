"use client";

import Upload04Icon from "@hugeicons/core-free-icons/Upload04Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { ExamSlot } from "@/lib/exam-dates/types";

export interface ScrapeResponse {
  success: boolean;
  slots?: ExamSlot[];
  count?: number;
  session?: string;
  year?: number;
  error?: string;
}

interface TimetableUploadProps {
  session: string;
  year: number;
  onParsed: (slots: ExamSlot[]) => void;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function TimetableUpload({ session, year, onParsed }: TimetableUploadProps) {
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        toast({ type: "error", message: "Please select a PDF file" });
        return;
      }

      setProcessing(true);

      try {
        const pdfBase64 = await readFileAsBase64(file);

        const res = await fetch("/api/exam-dates/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64, session, year }),
        });

        const data: ScrapeResponse = await res.json();

        if (!res.ok || !data.success) {
          toast({
            type: "error",
            message: data.error ?? "Failed to parse timetable",
            description: "Try a different PDF or check that the timetable is text-based",
          });
          return;
        }

        if (data.slots && data.slots.length > 0) {
          toast({
            type: "success",
            message: `Parsed ${data.count} exam dates from timetable`,
          });
          onParsed(data.slots);
        } else {
          toast({
            type: "warning",
            message: "No exam dates found in the timetable",
          });
        }
      } catch (err) {
        toast({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to process timetable",
        });
      } finally {
        setProcessing(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [session, year, onParsed],
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFile}
        aria-label="Upload exam timetable PDF"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={processing}
        className="gap-1.5 text-xs"
      >
        <HugeiconsIcon icon={Upload04Icon} data-icon="inline-start" />
        {processing ? "Processing..." : "Upload Timetable"}
      </Button>
    </>
  );
}
