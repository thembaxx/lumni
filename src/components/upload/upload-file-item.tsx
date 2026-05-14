"use client";

import {
	CheckCircleIcon,
	CloudArrowUp,
	FileIcon,
	ImageIcon,
	WarningCircle,
	XCircleIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
	if (type.startsWith("image/")) return ImageIcon;
	return FileIcon;
}

export type FileUploadState = {
	file: File;
	name: string;
	size: number;
	progress: number;
	status: "pending" | "uploading" | "complete" | "error";
	error?: string;
	url?: string;
};

export function UploadFileItem({
	item,
	onRetry,
}: {
	item: FileUploadState;
	onRetry?: () => void;
}) {
	const FileIconComponent = getFileIcon(item.file.type);
	const isComplete = item.status === "complete";
	const isError = item.status === "error";
	const isUploading = item.status === "uploading";

	return (
		<div
			className={cn(
				"group flex flex-col gap-2 rounded-lg border p-3 text-sm transition-colors",
				"bg-card text-card-foreground",
				isError && "border-destructive/40 bg-destructive/5",
				isComplete && "border-success/30 bg-success/5",
				!isError && !isComplete && "border-border",
			)}
		>
			<div className="flex items-start gap-3">
				<div
					className={cn(
						"flex size-9 shrink-0 items-center justify-center rounded-lg",
						"bg-muted",
						isComplete && "bg-success/10",
						isError && "bg-destructive/10",
					)}
				>
					{isComplete ? (
						<CheckCircleIcon
							className="size-4 text-success"
							data-icon="inline-start"
						/>
					) : isError ? (
						<XCircleIcon
							className="size-4 text-destructive"
							data-icon="inline-start"
						/>
					) : (
						<FileIconComponent
							className="size-4 text-muted-foreground"
							data-icon="inline-start"
						/>
					)}
				</div>

				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<p className="truncate font-medium">{item.name}</p>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary" className="text-[0.7rem]">
							{formatFileSize(item.size)}
						</Badge>
						{!isError && !isComplete && (
							<Badge variant="outline" className="text-[0.7rem]">
								{item.file.type.split("/")[1]?.toUpperCase() ?? "FILE"}
							</Badge>
						)}
						{isError && (
							<Badge variant="destructive" className="text-[0.7rem]">
								Failed
							</Badge>
						)}
						{isComplete && (
							<Badge
								variant="default"
								className="text-[0.7rem] bg-success text-success-foreground"
							>
								Done
							</Badge>
						)}
					</div>
				</div>

				{isError && onRetry && (
					<Button
						variant="outline"
						size="xs"
						onClick={onRetry}
						className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
					>
						Retry
					</Button>
				)}
			</div>

			{isUploading && (
				<div className="flex flex-col gap-1">
					<Progress value={item.progress} className="h-1.5" />
					<span className="text-xs text-muted-foreground tabular-nums">
						{item.progress}%
					</span>
				</div>
			)}

			{isError && (
				<p className="flex items-center gap-1.5 text-xs text-destructive">
					<WarningCircle className="size-3 shrink-0" data-icon="inline-start" />
					{item.error ?? "Upload failed"}
				</p>
			)}
		</div>
	);
}

export function UploadHeader({
	totalFiles,
	completedFiles,
	isUploading,
}: {
	totalFiles: number;
	completedFiles: number;
	isUploading: boolean;
}) {
	return (
		<div className="flex items-center gap-2">
			<CloudArrowUp
				className="size-5 text-foreground"
				data-icon="inline-start"
			/>
			<span className="font-medium">
				{isUploading
					? `Uploading ${totalFiles} file${totalFiles !== 1 ? "s" : ""}`
					: completedFiles > 0
						? `${completedFiles} of ${totalFiles} complete`
						: "Upload Files"}
			</span>
		</div>
	);
}
