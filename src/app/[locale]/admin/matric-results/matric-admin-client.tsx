"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CsvPreviewRow = {
  candidateNumber: string;
  firstName: string;
  lastName: string;
  examYear: number;
  session: string;
  subject: string;
  mark: number;
  outOf: number;
  level: number;
};

const CARD_CLASS =
  "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors";

export function MatricAdminClient() {
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<CsvPreviewRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    errors: number;
    errorRows: { row: number; message: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsePreview = useCallback((text: string) => {
    setCsvText(text);
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      setPreview([]);
      return;
    }
    const header = lines[0]
      .toLowerCase()
      .trim()
      .split(",")
      .map((h) => h.trim());
    const colMap = new Map<string, number>();
    for (const [i, h] of header.entries()) {
      colMap.set(h.replace(/\s+/g, ""), i);
    }
    const required = [
      "candidatenumber",
      "firstname",
      "lastname",
      "examyear",
      "session",
      "subject",
      "mark",
      "outof",
      "level",
    ];
    if (!required.every((c) => colMap.has(c))) {
      setPreview([]);
      return;
    }
    const rows: CsvPreviewRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]
        .trim()
        .split(",")
        .map((c) => c.trim());
      const get = (name: string) => cols[colMap.get(name)!] ?? "";
      const mark = Number.parseInt(get("mark"), 10);
      const outOf = Number.parseInt(get("outof"), 10);
      if (!get("candidatenumber")) continue;
      rows.push({
        candidateNumber: get("candidatenumber"),
        firstName: get("firstname"),
        lastName: get("lastname"),
        examYear: Number.parseInt(get("examyear"), 10),
        session: get("session"),
        subject: get("subject"),
        mark: Number.isNaN(mark) ? 0 : mark,
        outOf: Number.isNaN(outOf) ? 100 : outOf,
        level: Number.parseInt(get("level"), 10) || 1,
      });
    }
    setPreview(rows);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parsePreview(text);
      };
      reader.readAsText(file);
    },
    [parsePreview],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleUpload = useCallback(async () => {
    setIsUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("csvText", csvText);
      const res = await fetch("/api/admin/matric-results/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ inserted: 0, errors: 1, errorRows: [{ row: 0, message: "Upload failed" }] });
    } finally {
      setIsUploading(false);
    }
  }, [csvText]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 bg-background p-6">
      <div className="min-w-0">
        <h1 className="font-heading font-semibold text-2xl tracking-tight">
          Matric Results Upload
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Upload CSV data with NSC/SC matric results. Columns: candidateNumber, firstName, lastName,
          examYear, session, subject, mark, outOf, level
        </p>
      </div>

      <div
        className={`${CARD_CLASS} p-6`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Choose CSV File
            </Button>
            <span className="text-muted-foreground text-sm">or drag & drop here</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Textarea
            placeholder="Or paste CSV content here..."
            value={csvText}
            onChange={(e) => parsePreview(e.target.value)}
            rows={6}
            aria-label="CSV input"
          />
        </div>
      </div>

      {preview.length > 0 && (
        <div className={`${CARD_CLASS} overflow-x-auto`}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="p-3 font-medium">Candidate #</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Year</th>
                <th className="p-3 font-medium">Session</th>
                <th className="p-3 font-medium">Subject</th>
                <th className="p-3 font-medium">Mark</th>
                <th className="p-3 font-medium">Out Of</th>
                <th className="p-3 font-medium">Level</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 50).map((row, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="p-3 font-mono text-xs">{row.candidateNumber}</td>
                  <td className="p-3">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="p-3">{row.examYear}</td>
                  <td className="p-3">{row.session}</td>
                  <td className="p-3">{row.subject}</td>
                  <td className="p-3">{row.mark}</td>
                  <td className="p-3">{row.outOf}</td>
                  <td className="p-3">{row.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 50 && (
            <p className="p-3 text-muted-foreground text-xs">
              Showing first 50 of {preview.length} rows
            </p>
          )}
          <div className="flex items-center justify-between border-t border-border/60 p-3">
            <span className="text-muted-foreground text-sm">{preview.length} rows parsed</span>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : `Upload ${preview.length} Results`}
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className={`${CARD_CLASS} p-4`}>
          <p className="font-medium">
            {result.inserted > 0 ? `Inserted ${result.inserted} results` : "No results inserted"}
          </p>
          {result.errors > 0 && (
            <p className="mt-1 text-destructive text-sm">{result.errors} error(s)</p>
          )}
          {result.errorRows.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-destructive text-xs">
              {result.errorRows.map((e, i) => (
                <li key={i}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
