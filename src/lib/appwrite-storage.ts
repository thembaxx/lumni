import { ID, type InputFile } from "appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT, storage } from "./appwrite";

export const APPWRITE_BUCKET_ID =
	process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "";

export interface AppwriteUploadResult {
	$id: string;
	bucketId: string;
	fileName: string;
	size: number;
	mimeType: string;
	previewUrl: string;
	url: string;
}

export async function uploadFile(
	file: File | Blob,
	fileName: string,
	bucketId: string = APPWRITE_BUCKET_ID,
): Promise<AppwriteUploadResult> {
	const result = await storage.createFile(bucketId, ID.unique(), file, [
		ID.permission("read", "any"),
	]);

	const previewUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${result.$id}/preview?project=${APPWRITE_PROJECT}`;
	const url = `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${result.$id}/download?project=${APPWRITE_PROJECT}`;

	return {
		$id: result.$id,
		bucketId: result.bucketId,
		fileName: result.name,
		size: result.size,
		mimeType: result.mimeType,
		previewUrl,
		url,
	};
}

export async function getFile(
	fileId: string,
	bucketId: string = APPWRITE_BUCKET_ID,
) {
	return storage.getFile(bucketId, fileId);
}

export async function deleteFile(
	fileId: string,
	bucketId: string = APPWRITE_BUCKET_ID,
) {
	return storage.deleteFile(bucketId, fileId);
}

export async function listFiles(
	bucketId: string = APPWRITE_BUCKET_ID,
	queries: string[] = [],
) {
	return storage.listFiles(bucketId, queries);
}

export async function getFileDownloadUrl(
	fileId: string,
	bucketId: string = APPWRITE_BUCKET_ID,
) {
	return storage.getFileDownload(bucketId, fileId);
}

export async function getFilePreviewUrl(
	fileId: string,
	bucketId: string = APPWRITE_BUCKET_ID,
	width?: number,
	height?: number,
) {
	return storage.getFilePreview(bucketId, fileId, undefined, width, height);
}
