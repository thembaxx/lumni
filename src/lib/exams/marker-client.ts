import { UTApi, UTFile } from "uploadthing/server";

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
