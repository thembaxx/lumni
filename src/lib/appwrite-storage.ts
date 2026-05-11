import {
	ID,
	ImageGravity,
	Storage as NodeStorage,
	Permission,
} from "node-appwrite";
import { InputFile } from "node-appwrite/inputFile";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT, serverClient } from "./appwrite";

const storage = new NodeStorage(serverClient);

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
	const fileInput =
		file instanceof File
			? InputFile.fromBlob(file, file.name)
			: InputFile.fromBlob(file, fileName);

	const result = await storage.createFile(
		bucketId,
		ID.unique(),
		fileInput as unknown as Parameters<typeof storage.createFile>[2],
		[Permission.read("any")],
	);

	const previewUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${result.$id}/preview?project=${APPWRITE_PROJECT}`;
	const url = `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${result.$id}/download?project=${APPWRITE_PROJECT}`;

	return {
		$id: result.$id,
		bucketId: result.bucketId,
		fileName: result.name,
		size: result.sizeOriginal,
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
	gravity?: ImageGravity,
) {
	return storage.getFilePreview(
		bucketId,
		fileId,
		width,
		height,
		gravity ?? ImageGravity.Center,
	);
}
