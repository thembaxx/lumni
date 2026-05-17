"use client";

import {
	CheckmarkCircle01Icon,
	CloudUploadIcon,
	File02Icon,
	RadialIcon,
	AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/lib/uploadthing";

interface AdminExamUploadZoneProps {
	onUploadComplete: () => void;
}

type UploadState = "idle" | "uploading" | "converting" | "success" | "error";

export function AdminExamUploadZone({
	onUploadComplete,
}: AdminExamUploadZoneProps) {
	const [state, setState] = useState<UploadState>("idle");
	const [message, setMessage] = useState("");

	const handleUploadComplete = async (res: { key: string }[]) => {
		if (!res?.[0]?.key) {
			setState("error");
			setMessage("Upload failed - no file key returned");
			return;
		}

		setState("converting");
		setMessage("Converting PDF to structured exam...");

		try {
			const response = await fetch("/api/admin/exams/upload", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ fileKey: res[0].key }),
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error || "Conversion failed");
			}

			setState("success");
			setMessage("Exam uploaded and converted successfully!");
			onUploadComplete();

			setTimeout(() => {
				setState("idle");
				setMessage("");
			}, 3000);
		} catch (err) {
			setState("error");
			setMessage(err instanceof Error ? err.message : "Conversion failed");
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="text-sm font-medium">Upload Exam Paper</div>

			{state === "idle" && (
				<UploadDropzone
					endpoint="examPapersUploader"
					onUploadBegin={() => {
						setState("uploading");
						setMessage("Uploading PDF...");
					}}
					onClientUploadComplete={(res) => {
						handleUploadComplete(res.map((f) => ({ key: f.key })));
					}}
					onUploadError={(err: Error) => {
						setState("error");
						setMessage(err.message);
					}}
					className="border-2 border-dashed rounded-lg py-8 ut-button:bg-[--system-accent] ut-button:text-background ut-button:text-sm ut-allowed-content:text-muted-foreground ut-label:text-foreground"
				/>
			)}

			{state === "uploading" && (
				<div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
					<HugeiconsIcon
						icon={RadialIcon}
						className="size-5 animate-spin text-muted-foreground"
					/>
					<div>
						<p className="text-sm font-medium">Uploading PDF...</p>
						<p className="text-xs text-muted-foreground">
							Uploading to storage
						</p>
					</div>
				</div>
			)}

			{state === "converting" && (
				<div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
					<HugeiconsIcon
						icon={RadialIcon}
						className="size-5 animate-spin text-foreground"
					/>
					<div>
						<p className="text-sm font-medium">Converting...</p>
						<p className="text-xs text-muted-foreground">
							Extracting text, parsing questions, building structured exam
						</p>
					</div>
				</div>
			)}

			{state === "success" && (
				<div className="flex items-center gap-3 p-4 border rounded-lg bg-emerald-50">
					<HugeiconsIcon
						icon={CheckmarkCircle01Icon}
						className="size-5 text-emerald-600"
					/>
					<div>
						<p className="text-sm font-medium text-emerald-700">Success!</p>
						<p className="text-xs text-emerald-600">{message}</p>
					</div>
				</div>
			)}

			{state === "error" && (
				<div className="flex items-center gap-3 p-4 border rounded-lg bg-destructive/5">
					<HugeiconsIcon
						icon={AlertCircleIcon}
						className="size-5 text-destructive"
					/>
					<div className="flex-1">
						<p className="text-sm font-medium text-destructive">Error</p>
						<p className="text-xs text-destructive/80">{message}</p>
					</div>
					<Button variant="outline" size="sm" onClick={() => setState("idle")}>
						Try Again
					</Button>
				</div>
			)}
		</div>
	);
}
