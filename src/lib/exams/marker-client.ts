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

	const uploads = images.map(async (img) => {
		const base64Data = img.data.includes("base64,")
			? img.data.split("base64,")[1]
			: img.data;
		const buffer = Buffer.from(base64Data, "base64");
		const uint8Array = new Uint8Array(buffer);

		const utFile = new UTFile([uint8Array], img.filename);

		const result = await utapi.uploadFiles(utFile);
		if (result.error) {
			throw new Error(
				`Failed to upload image ${img.filename}: ${result.error}`,
			);
		}

		const url = result.data?.ufsUrl || result.data?.url || "";
		imageUrlMap[img.filename] = url;
		return { filename: img.filename, url };
	});

	await Promise.all(uploads);

	let updatedMarkdown = markdown;
	for (const [origPath, uploadUrl] of Object.entries(imageUrlMap)) {
		updatedMarkdown = updatedMarkdown.replace(
			new RegExp(`\\(${escapeRegex(origPath)}\\)`, "g"),
			`(${uploadUrl})`,
		);
	}

	return { markdown: updatedMarkdown, imageUrlMap };
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
