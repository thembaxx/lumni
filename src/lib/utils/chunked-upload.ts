export interface ChunkedUploadOptions {
	file: File;
	chunkSize?: number;
	onProgress?: (progress: number) => void;
	onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
	apiEndpoint?: string;
}

export interface ChunkedUploadResult {
	success: boolean;
	fileUrl?: string;
	totalChunks?: number;
	error?: string;
}

const DEFAULT_CHUNK_SIZE = 1024 * 1024;
const MAX_RETRIES = 3;

export async function uploadFileInChunks({
	file,
	chunkSize = DEFAULT_CHUNK_SIZE,
	onProgress,
	onChunkComplete,
	apiEndpoint = "/api/upload-chunk",
}: ChunkedUploadOptions): Promise<ChunkedUploadResult> {
	const totalChunks = Math.ceil(file.size / chunkSize);
	let uploadedSize = 0;
	let uploadedChunks = 0;

	try {
		for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
			const start = chunkIndex * chunkSize;
			const end = Math.min(start + chunkSize, file.size);
			const chunk = file.slice(start, end);

			let retries = 0;
			let chunkUploaded = false;

			while (!chunkUploaded && retries < MAX_RETRIES) {
				try {
					const formData = new FormData();
					formData.append("chunk", chunk);
					formData.append("fileName", file.name);
					formData.append("chunkIndex", String(chunkIndex));
					formData.append("totalChunks", String(totalChunks));
					formData.append("totalSize", String(file.size));

					const response = await fetch(apiEndpoint, {
						method: "POST",
						body: formData,
					});

					if (!response.ok) {
						throw new Error(
							`Chunk ${chunkIndex} upload failed: ${response.status}`,
						);
					}

					const result = await response.json();

					if (result.complete) {
						return {
							success: true,
							fileUrl: result.fileUrl,
							totalChunks,
						};
					}

					chunkUploaded = true;
				} catch (_error) {
					retries++;
					if (retries >= MAX_RETRIES) {
						throw new Error(
							`Failed to upload chunk ${chunkIndex} after ${MAX_RETRIES} retries`,
						);
					}
					await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
				}
			}

			uploadedSize += chunk.size;
			uploadedChunks++;
			onProgress?.(Math.round((uploadedSize / file.size) * 100));
			onChunkComplete?.(uploadedChunks, totalChunks);
		}

		return {
			success: false,
			error: "Upload incomplete - no completion signal received",
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown upload error",
		};
	}
}

export async function uploadJSONInChunks(
	jsonContent: string,
	options: Omit<ChunkedUploadOptions, "file">,
): Promise<ChunkedUploadResult> {
	const blob = new Blob([jsonContent], { type: "application/json" });
	const file = new File([blob], "questions.json", {
		type: "application/json",
	});

	return uploadFileInChunks({ ...options, file });
}

export function calculateOptimalChunkSize(fileSize: number): number {
	if (fileSize <= 1024 * 1024) return 256 * 1024;
	if (fileSize <= 5 * 1024 * 1024) return 512 * 1024;
	if (fileSize <= 10 * 1024 * 1024) return 1024 * 1024;
	return 2 * 1024 * 1024;
}

export function validateFileForUpload(file: File): {
	valid: boolean;
	error?: string;
} {
	const maxSize = 50 * 1024 * 1024;

	if (file.size > maxSize) {
		return {
			valid: false,
			error: `File too large. Maximum size is 50MB.`,
		};
	}

	const allowedTypes = [
		"application/json",
		"application/pdf",
		"text/csv",
		"text/plain",
	];

	if (!allowedTypes.includes(file.type)) {
		return {
			valid: false,
			error: `Invalid file type. Allowed: JSON, PDF, CSV, TXT`,
		};
	}

	return { valid: true };
}
