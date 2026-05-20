"use client";

import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { UploadedFile } from "@/lib/uploadthing";
import { useUploadThing } from "@/lib/uploadthing";
import {
	type FileUploadState,
	UploadFileItem,
	UploadHeader,
} from "./upload-file-item";

let openUploadRef:
	| ((files: File[], endpoint?: "generalUploader") => void)
	| null = null;

export function openUploadDialog(
	files: File[],
	endpoint: "generalUploader" = "generalUploader",
) {
	openUploadRef?.(files, endpoint);
}

export function UploadDialogRenderer({
	children,
}: {
	children?: React.ReactNode;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [items, setItems] = useState<FileUploadState[]>([]);
	const [endpoint, setEndpoint] = useState("generalUploader" as const);
	const pendingFilesRef = useRef<File[]>([]);
	const startUploadRef = useRef<
		((files: File[]) => Promise<UploadedFile[] | undefined> | undefined) | null
	>(null);
	const fileNameToItemRef = useRef<Map<string, number>>(new Map());

	const { startUpload, isUploading } = useUploadThing(endpoint, {
		uploadProgressGranularity: "fine",
		onClientUploadComplete: (res: UploadedFile[]) => {
			setItems((prev) =>
				prev.map((item) => {
					const uploaded = res.find((r) => r.name === item.name);
					if (!uploaded) return item;
					return { ...item, status: "complete", url: uploaded.url };
				}),
			);
		},
		onUploadError: (error: Error) => {
			setItems((prev) =>
				prev.map((item) => {
					if (item.status === "uploading") {
						return { ...item, status: "error", error: error.message };
					}
					return item;
				}),
			);
		},
		onUploadProgress: (progress: number) => {
			setItems((prev) =>
				prev.map((item) => {
					if (item.status === "uploading") {
						return { ...item, progress };
					}
					return item;
				}),
			);
		},
	});

	startUploadRef.current = startUpload;

	const open = useCallback((files: File[], ep?: "generalUploader") => {
		if (ep) setEndpoint(ep);
		const newItems = files.map((file) => ({
			file,
			name: file.name,
			size: file.size,
			progress: 0,
			status: "pending" as const,
		}));
		const nameMap = new Map<string, number>();
		newItems.forEach((item, idx) => {
			nameMap.set(item.name, idx);
		});
		fileNameToItemRef.current = nameMap;
		setItems(newItems);
		pendingFilesRef.current = files;
		setIsOpen(true);
		setTimeout(() => {
			if (startUploadRef.current) {
				startUploadRef.current(files);
			}
		}, 50);
	}, []);

	useEffect(() => {
		openUploadRef = open;
	}, [open]);

	useEffect(() => {
		if (items.length === 0 || isUploading) return;
		const allDone = items.every(
			(item) => item.status === "complete" || item.status === "error",
		);
		if (allDone) {
			const timer = setTimeout(() => setIsOpen(false), 1500);
			return () => clearTimeout(timer);
		}
	}, [items, isUploading]);

	const close = useCallback(() => {
		setIsOpen(false);
		setItems([]);
		pendingFilesRef.current = [];
	}, []);

	const cancel = useCallback(() => {
		setIsOpen(false);
		setItems([]);
		pendingFilesRef.current = [];
	}, []);

	const retryFailed = useCallback(() => {
		const failedFiles = items.reduce((acc, item) => {
			if (item.status === "error") acc.push(item.file);
			return acc;
		}, [] as File[]);
		if (failedFiles.length === 0) return;

		setItems((prev) =>
			prev.map((item) =>
				item.status === "error"
					? { ...item, status: "pending", progress: 0, error: undefined }
					: item,
			),
		);
		setTimeout(() => {
			startUploadRef.current?.(failedFiles);
		}, 0);
	}, [items]);

	const hasErrors = items.some((item) => item.status === "error");
	const completedCount = items.filter(
		(item) => item.status === "complete",
	).length;

	return (
		<>
			{children}
			<Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							<UploadHeader
								totalFiles={items.length}
								completedFiles={completedCount}
								isUploading={isUploading}
							/>
						</DialogTitle>
						{hasErrors && (
							<DialogDescription className="flex items-center gap-1.5 text-destructive">
								<HugeiconsIcon
									icon={AlertCircleIcon}
									className="size-4 shrink-0"
									data-icon="inline-start"
								/>
								Some files failed to upload
							</DialogDescription>
						)}
					</DialogHeader>

					<div className="-mx-1 flex max-h-64 flex-col gap-2 overflow-y-auto px-1">
						{items.map((item) => (
							<UploadFileItem
								key={`${item.name}-${item.size}`}
								item={item}
								onRetry={item.status === "error" ? retryFailed : undefined}
							/>
						))}
					</div>

					<DialogFooter>
						{isUploading ? (
							<Button variant="outline" onClick={cancel} className="w-full">
								Cancel
							</Button>
						) : (
							<div className="flex w-full gap-2">
								{hasErrors && (
									<Button
										variant="secondary"
										onClick={retryFailed}
										className="flex-1"
									>
										Retry Failed
									</Button>
								)}
								<Button onClick={close} className="flex-1">
									{hasErrors ? "Close" : "Done"}
								</Button>
							</div>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
