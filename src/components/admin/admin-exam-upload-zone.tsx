"use client";

import {
	AlertCircleIcon,
	CheckmarkCircle01Icon,
	RadialIcon,
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
		setMessage("Converting PDF to structured exam…");

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
			<div className="font-medium text-sm">Upload Exam Paper</div>

			{state === "idle" && (
				<UploadDropzone
					endpoint="examPapersUploader"
					onUploadBegin={() => {
						setState("uploading");
						setMessage("Uploading PDF…");
					}}
					onClientUploadComplete={(res) => {
						handleUploadComplete(res.map((f) => ({ key: f.key })));
					}}
					onUploadError={(err: Error) => {
						setState("error");
						setMessage(err.message);
					}}
					className="rounded-lg border-2 border-dashed ut-button:bg-[--system-accent] py-8 ut-allowed-content:text-muted-foreground ut-button:text-background ut-button:text-sm ut-label:text-foreground"
				/>
			)}

			{state === "uploading" && (
				<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
					<HugeiconsIcon
						icon={RadialIcon}
						className="size-5 animate-spin text-muted-foreground"
					/>
					<div>
						<p className="font-medium text-sm">Uploading PDF...</p>
						<p className="text-muted-foreground text-xs">
							Uploading to storage
						</p>
					</div>
				</div>
			)}

			{state === "converting" && (
				<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
					<HugeiconsIcon
						icon={RadialIcon}
						className="size-5 animate-spin text-foreground"
					/>
					<div>
						<p className="font-medium text-sm">Converting...</p>
						<p className="text-muted-foreground text-xs">
							Extracting text, parsing questions, building structured exam
						</p>
					</div>
				</div>
			)}

			{state === "success" && (
				<div className="flex items-center gap-3 rounded-lg border bg-emerald-50 p-4">
					<HugeiconsIcon
						icon={CheckmarkCircle01Icon}
						className="size-5 text-emerald-600"
					/>
					<div>
						<p className="font-medium text-emerald-700 text-sm">Success!</p>
						<p className="text-emerald-600 text-xs">{message}</p>
					</div>
				</div>
			)}

			{state === "error" && (
				<div className="flex items-center gap-3 rounded-lg border bg-destructive/5 p-4">
					<HugeiconsIcon
						icon={AlertCircleIcon}
						className="size-5 text-destructive"
					/>
					<div className="flex-1">
						<p className="font-medium text-destructive text-sm">Error</p>
						<p className="text-destructive/80 text-xs">{message}</p>
					</div>
					<Button variant="outline" size="sm" onClick={() => setState("idle")}>
						Try Again
					</Button>
				</div>
			)}
		</div>
	);
}
