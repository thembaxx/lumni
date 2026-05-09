"use client";

import { useCallback, useState } from "react";
import {
	APPWRITE_BUCKET_ID,
	type AppwriteUploadResult,
	deleteFile,
	getFile,
	listFiles,
	uploadFile,
} from "./appwrite-storage";

interface UseAppwriteStorageOptions {
	bucketId?: string;
}

interface UseAppwriteStorageReturn {
	upload: (
		file: File | Blob,
		fileName: string,
	) => Promise<AppwriteUploadResult | null>;
	remove: (fileId: string) => Promise<void>;
	files: Awaited<ReturnType<typeof listFiles>>["files"];
	loading: boolean;
	error: Error | null;
	refresh: () => Promise<void>;
}

export function useAppwriteStorage(
	options: UseAppwriteStorageOptions = {},
): UseAppwriteStorageReturn {
	const bucketId = options.bucketId || APPWRITE_BUCKET_ID;
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [files, setFiles] = useState<
		Awaited<ReturnType<typeof listFiles>>["files"]
	>([]);

	const upload = useCallback(
		async (file: File | Blob, fileName: string) => {
			setLoading(true);
			setError(null);
			try {
				const result = await uploadFile(file, fileName, bucketId);
				return result;
			} catch (e) {
				setError(e as Error);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[bucketId],
	);

	const remove = useCallback(
		async (fileId: string) => {
			setLoading(true);
			setError(null);
			try {
				await deleteFile(fileId, bucketId);
			} catch (e) {
				setError(e as Error);
			} finally {
				setLoading(false);
			}
		},
		[bucketId],
	);

	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await listFiles(bucketId);
			setFiles(result.files);
		} catch (e) {
			setError(e as Error);
		} finally {
			setLoading(false);
		}
	}, [bucketId]);

	return {
		upload,
		remove,
		files,
		loading,
		error,
		refresh,
	};
}

interface UseAppwriteFileOptions {
	bucketId?: string;
}

interface UseAppwriteFileReturn {
	file: Awaited<ReturnType<typeof getFile>> | null;
	loading: boolean;
	error: Error | null;
	refresh: () => Promise<void>;
}

export function useAppwriteFile(
	fileId: string | null,
	options: UseAppwriteFileOptions = {},
): UseAppwriteFileReturn {
	const bucketId = options.bucketId || APPWRITE_BUCKET_ID;
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [file, setFile] = useState<Awaited<ReturnType<typeof getFile>> | null>(
		null,
	);

	const refresh = useCallback(async () => {
		if (!fileId) return;
		setLoading(true);
		setError(null);
		try {
			const result = await getFile(fileId, bucketId);
			setFile(result);
		} catch (e) {
			setError(e as Error);
		} finally {
			setLoading(false);
		}
	}, [fileId, bucketId]);

	return {
		file,
		loading,
		error,
		refresh,
	};
}
