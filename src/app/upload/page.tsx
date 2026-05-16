"use client";

import {
	CheckCircle,
	CloudArrowUp,
	Database,
	Spinner,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
	const [lastUploadUrl, setLastUploadUrl] = useState<string | null>(null);
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
		setLastUploadUrl(urls[0] || null);

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
		<div className="min-h-[100dvh] bg-[--system-grouped-background]">
			<div className="mx-auto max-w-md">
				<div className="px-[--space-4] pt-safe pb-[--space-2]">
					<h1 className="ios-large-title text-[--system-text-primary]">
						Upload QA Files
					</h1>
				</div>

				<div className="px-[--space-4] space-y-[--space-4] pb-[--space-8]">
					<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
						<header>
							<h2 className="font-heading text-sm font-medium flex flex-col items-center gap-3 text-center">
								<span className="flex items-center gap-2">
									<CloudArrowUp className="size-4" />
									Upload
								</span>
							</h2>
							<p className="text-xs/relaxed text-muted-foreground">
								Upload JSON question files for subjects
							</p>
						</header>
						<div className="px-4 group-data-[size=sm]/card:px-3 space-y-[--space-3]">
							<UploadButton
								endpoint="qaUploader"
								onClientUploadComplete={handleUploadComplete}
								onUploadError={(error: Error) => {
									console.error("Upload error:", error);
								}}
							/>

							{lastUploadUrl && (
								<div className="rounded-[--radius-button] bg-[var(--success)]/10 p-[--space-4] text-center">
									<motion.div
										initial={{ scale: 0, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										transition={{ duration: 0.3 }}
									>
										<CheckCircle className="size-16 mx-auto mb-2 text-success" />
									</motion.div>
									<p className="text-[13px] font-medium text-[var(--success)]">
										Upload successful
									</p>
									<p className="text-[12px] text-muted-foreground break-all mt-1">
										{lastUploadUrl}
									</p>
								</div>
							)}
						</div>
					</div>

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

					<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
						<header>
							<h2 className="font-heading text-sm font-medium flex items-center gap-2">
								<Database className="size-4" />
								Database
							</h2>
							<p className="text-xs/relaxed text-muted-foreground">
								Seed the database with initial data
							</p>
						</header>
						<div className="px-4 group-data-[size=sm]/card:px-3">
							<Button
								variant="outline"
								onClick={handleSeedDatabase}
								disabled={seedStatus === "seeding"}
								className="w-full"
							>
								{seedStatus === "seeding" ? (
									<Spinner className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Database className="size-4 mr-2" />
								)}
								{seedStatus === "seeding"
									? "Seeding..."
									: seedStatus === "done"
										? "Seeded!"
										: "Seed Database"}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
