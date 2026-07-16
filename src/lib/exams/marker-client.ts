import { UTApi, UTFile } from "uploadthing/server";
import { logError } from "@/lib/shared/logger";

export interface MarkerImage {
  filename: string;
  data: string;
}

export interface MarkerResult {
  markdown: string;
  images: MarkerImage[];
  metadata: Record<string, string | number | string[]>;
}

export interface ProcessedMarkdown {
  markdown: string;
  imageUrlMap: Record<string, string>;
}

const MARKER_API_URL = process.env.MARKER_API_URL || "http://localhost:8000";

export async function convertPdfWithMarker(
  pdfBuffer: Buffer,
  filename: string,
): Promise<MarkerResult> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(pdfBuffer)], {
    type: "application/pdf",
  });
  formData.append("file", blob, filename);

  const response = await fetch(`${MARKER_API_URL}/convert`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Marker conversion failed (${response.status}): ${text}`);
  }

  const result: MarkerResult = await response.json();
  return result;
}

async function extractTextWithPdfParse(pdfBuffer: Buffer): Promise<string | null> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
    const result = await parser.getText();
    const text = result.text?.trim();
    if (text && text.length > 50) return text;
    return null;
  } catch (err) {
    logError("marker-client.extractTextWithPdfParse", err);
    return null;
  }
}

async function tryOcrWithTesseract(pdfBuffer: Buffer): Promise<string | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { createWorker } = await import("tesseract.js");

    const data = new Uint8Array(pdfBuffer);
    const doc = await pdfjsLib.getDocument({ data }).promise;

    const Canvas = await tryLoadCanvas();
    if (!Canvas) {
      logError(
        "marker-client.tryOcrWithTesseract",
        new Error("canvas (node-canvas) not available — install it for OCR support"),
      );
      return null;
    }

    const worker = await createWorker("eng", undefined, {
      logger: () => {},
    });

    const pages: string[] = [];
    const scale = 2.0;

    for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = new Canvas(viewport.width, viewport.height);
      const ctx = canvas.getContext("2d");
      const renderTask = page.render({ canvas: null, canvasContext: ctx, viewport });
      await renderTask.promise;
      const imageData = canvas.toBuffer("image/png");
      const { data: ocrData } = await worker.recognize(imageData);
      if (ocrData.text?.trim()) {
        pages.push(ocrData.text.trim());
      }
    }

    await worker.terminate();
    return pages.length > 0 ? pages.join("\n\n") : null;
  } catch (err) {
    logError("marker-client.tryOcrWithTesseract", err);
    return null;
  }
}

async function tryLoadCanvas(): Promise<(typeof import("canvas"))["Canvas"] | null> {
  try {
    const mod = await import("canvas");
    return mod.Canvas;
  } catch {
    return null;
  }
}

export async function convertPdfWithFallback(
  pdfBuffer: Buffer,
  filename: string,
): Promise<MarkerResult> {
  const textLines: string[] = [`# ${filename.replace(/\.pdf$/i, "")}`, ""];

  let extractedText: string | null = null;
  let usedFallback: string | null = null;

  const markerText = await tryMarker(pdfBuffer, filename);
  if (markerText) {
    extractedText = markerText;
    usedFallback = "marker";
  }

  if (!extractedText) {
    const pdfParseText = await extractTextWithPdfParse(pdfBuffer);
    if (pdfParseText) {
      extractedText = pdfParseText;
      usedFallback = "pdf-parse";
    }
  }

  if (!extractedText) {
    const ocrText = await tryOcrWithTesseract(pdfBuffer);
    if (ocrText) {
      extractedText = ocrText;
      usedFallback = "tesseract-ocr";
    }
  }

  if (extractedText) {
    textLines.push(extractedText);
    textLines.push("", `> *Processed via ${usedFallback} fallback*`);
  } else {
    textLines.push("*No text could be extracted from this PDF.*");
  }

  return {
    markdown: textLines.join("\n"),
    images: [],
    metadata: { filename, fallback: usedFallback ?? "none" },
  };
}

async function tryMarker(pdfBuffer: Buffer, filename: string): Promise<string | null> {
  try {
    const result = await convertPdfWithMarker(pdfBuffer, filename);
    if (result.markdown?.trim().length > 50) return result.markdown;
    return null;
  } catch {
    return null;
  }
}

export async function uploadImagesAndRewriteMarkdown(
  markdown: string,
  images: MarkerImage[],
): Promise<ProcessedMarkdown> {
  if (images.length === 0) {
    return { markdown, imageUrlMap: {} };
  }

  const utapi = new UTApi();
  const imageUrlMap: Record<string, string> = {};

  const base64Marker = "base64,";
  const uploadPromises: Promise<{ filename: string; url: string }>[] = [];
  for (const img of images) {
    const hasBase64Prefix = img.data.startsWith(`data:${base64Marker}`);
    const base64Data = hasBase64Prefix ? (img.data.split(base64Marker)[1] ?? img.data) : img.data;
    const buffer = Buffer.from(base64Data, "base64");
    const uint8Array = new Uint8Array(buffer);

    const utFile = new UTFile([uint8Array], img.filename);

    uploadPromises.push(
      utapi.uploadFiles(utFile).then((result) => {
        if (result.error) {
          throw new Error(`Failed to upload image ${img.filename}: ${result.error}`);
        }

        const url = result.data?.ufsUrl ?? "";
        imageUrlMap[img.filename] = url;
        return { filename: img.filename, url };
      }),
    );
  }

  const _uploads = await Promise.all(uploadPromises);

  let updatedMarkdown = markdown;
  const entries = Object.entries(imageUrlMap);
  if (entries.length > 0) {
    const pattern = new RegExp(`\\((${entries.map(([p]) => escapeRegex(p)).join("|")})\\)`, "g");
    updatedMarkdown = updatedMarkdown.replace(pattern, (_match, path) => {
      return `(${imageUrlMap[path as string]})`;
    });
  }

  return { markdown: updatedMarkdown, imageUrlMap };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
