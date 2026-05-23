"use client";

import {
	CheckmarkCircle01Icon,
	CloudUploadIcon,
	DatabaseIcon,
	RadialIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useRef, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { ListCell, ListGroup, ListSection } from "@/components/ui/list-cell";
import { extractSubjectFromFileName } from "@/lib/upload";
import { UploadButton } from "@/lib/uploadthing";

export default function UploadPage() {
	const _uploadedUrls = useRef<string[]>([]);
	const [lastUploadUrl, setLastUploadUrl] = useState<string | null>(null);
	const _syncStatus = useRef<"idle" | "syncing" | "done" | "error">("idle");
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
		_uploadedUrls.current = urls;
		setLastUploadUrl(urls[0] || null);

		const fileName = files[0]?.name || "";
		const subject = extractSubjectFromFileName(fileName);

		if (subject) {
			_syncStatus.current = "syncing";
			try {
				await fetch("/api/sync", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ subject, action: "sync" }),
				});
				_syncStatus.current = "done";
			} catch {
				_syncStatus.current = "error";
			}
		}
	};

	return (
		<div className="min-h-[100dvh] bg-[--system-grouped-background]">
			<PageContainer>
				<div className="pt-safe pb-[--space-2]">
					<h1 className="ios-large-title text-[--system-text-primary]">
						Upload QA Files
					</h1>
				</div>

				<div className="flex flex-col gap-[--space-4] pb-[--space-8]">
					<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
						<header>
							<h2 className="flex flex-col items-center gap-3 text-center font-heading font-medium text-sm">
								<span className="flex items-center gap-2">
									<HugeiconsIcon icon={CloudUploadIcon} className="size-4" />
									Upload
								</span>
							</h2>
							<p className="text-muted-foreground text-xs/relaxed">
								Upload JSON question files for subjects
							</p>
						</header>
						<div className="flex flex-col gap-[--space-3] px-4 group-data-[size=sm]/card:px-3">
							<UploadButton
								endpoint="qaUploader"
								onClientUploadComplete={handleUploadComplete}
								onUploadError={(error: Error) => {
									console.error("Upload error:", error);
								}}
							/>

							{lastUploadUrl && (
								<div className="rounded-[--radius-button] bg-[var(--success)]/10 p-[--space-4] text-center">
									<m.div
										initial={{ scale: 0.95, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										transition={{ duration: 0.3 }}
									>
										<HugeiconsIcon
											icon={CheckmarkCircle01Icon}
											className="mx-auto mb-2 size-16 text-success"
										/>
									</m.div>
									<p className="font-medium text-[13px] text-[var(--success)]">
										Upload successful
									</p>
									<p className="mt-1 break-all text-[12px] text-muted-foreground">
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

					<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
						<header>
							<h2 className="flex items-center gap-2 font-heading font-medium text-sm">
								<HugeiconsIcon icon={DatabaseIcon} className="size-4" />
								Database
							</h2>
							<p className="text-muted-foreground text-xs/relaxed">
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
									<HugeiconsIcon
										icon={RadialIcon}
										className="mr-2 size-4 animate-spin"
									/>
								) : (
									<HugeiconsIcon icon={DatabaseIcon} className="mr-2 size-4" />
								)}
								{seedStatus === "seeding"
									? "Seeding…"
									: seedStatus === "done"
										? "Seeded!"
										: "Seed Database"}
							</Button>
						</div>
					</div>
				</div>
			</PageContainer>
		</div>
	);
}
