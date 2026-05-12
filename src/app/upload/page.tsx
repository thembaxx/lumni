"use client";

import {
	CheckmarkCircle01Icon,
	CloudUploadIcon,
	DatabaseIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ListCell, ListGroup, ListSection } from "@/components/ui/list-cell";
import { UploadButton } from "@/lib/uploadthing";

function formatSubjectName(subject: string): string {
	return subject.replace(/\s+/g, "_").toLowerCase();
}

function _generateFileName(subject: string, number: number): string {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

function extractSubjectFromFileName(fileName: string): string {
	const match = fileName.match(/^([a-z_-]+)_qa_\d+\.json$/i);
	if (match) {
		return match[1].replace(/_/g, "-").toLowerCase();
	}
	return "";
}

export default function UploadPage() {
	const [_uploadedUrls, setUploadedUrls] = useState<string[]>([]);
	const [lastUpload, setLastUpload] = useState<string | null>(null);
	const [_syncStatus, setSyncStatus] = useState<
		"idle" | "syncing" | "done" | "error"
	>("idle");
	const [seedStatus, setSeedStatus] = useState<
		"idle" | "seeding" | "done" | "error"
	>("idle");

	const handleSeedDatabase = async () => {
		setSeedStatus("seeding");
		try {
			const res = await fetch("/api/seed", { method: "POST" });
			const data = await res.json();
			if (data.success) {
				setSeedStatus("done");
			} else {
				setSeedStatus("error");
			}
		} catch {
			setSeedStatus("error");
		}
	};

	const handleUploadComplete = async (
		files: { url: string; name: string }[],
	) => {
		const urls = files.map((f) => f.url);
		setUploadedUrls(urls);
		setLastUpload(urls[0] || null);

		const fileName = files[0]?.name || "";
		const subject = extractSubjectFromFileName(fileName);

		if (subject) {
			setSyncStatus("syncing");
			try {
				await fetch("/api/sync", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ subject, action: "sync" }),
				});
				setSyncStatus("done");
			} catch {
				setSyncStatus("error");
			}
		}
	};

	return (
		<div className="min-h-screen bg-[--system-grouped-background]">
			<div className="mx-auto max-w-md">
				<div className="px-[--space-4] pt-safe pb-[--space-2]">
					<h1 className="ios-large-title text-[--system-text-primary]">
						Upload QA Files
					</h1>
				</div>

				<div className="px-[--space-4] space-y-[--space-4] pb-[--space-8]">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<HugeiconsIcon icon={CloudUploadIcon} className="size-4" />
								Upload
							</CardTitle>
							<CardDescription>
								Upload JSON question files for subjects
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-[--space-3]">
							<UploadButton
								endpoint="qaUploader"
								onClientUploadComplete={handleUploadComplete}
								onUploadError={(error: Error) => {
									console.error("Upload error:", error);
								}}
							/>

							{lastUpload && (
								<div className="rounded-[--radius-button] bg-[oklch(var(--success))]/10 p-[--space-3]">
									<p className="text-[13px] font-medium text-[oklch(var(--success))] flex items-center gap-1.5">
										<HugeiconsIcon
											icon={CheckmarkCircle01Icon}
											className="size-4"
										/>
										Upload successful
									</p>
									<p className="text-[12px] text-muted-foreground break-all mt-1">
										{lastUpload}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					<ListSection header="File Naming Convention">
						<ListGroup>
							<ListCell title="Format" subtitle="[subject]_qa_[number].json" />
							<ListCell
								title="Example"
								subtitle="physical_sciences_qa_1.json"
								showSeparator={false}
							/>
						</ListGroup>
					</ListSection>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<HugeiconsIcon icon={DatabaseIcon} className="size-4" />
								Database
							</CardTitle>
							<CardDescription>
								Seed the database with initial data
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								variant="outline"
								onClick={handleSeedDatabase}
								disabled={seedStatus === "seeding"}
								className="w-full"
							>
								{seedStatus === "seeding" ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<HugeiconsIcon icon={DatabaseIcon} className="size-4 mr-2" />
								)}
								{seedStatus === "seeding"
									? "Seeding..."
									: seedStatus === "done"
										? "Seeded!"
										: "Seed Database"}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
