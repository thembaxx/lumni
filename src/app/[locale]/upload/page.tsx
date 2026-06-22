"use client";

import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import CloudUploadIcon from "@hugeicons/core-free-icons/CloudUploadIcon";
import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon";
import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { ListCell, ListGroup, ListSection } from "@/components/ui/list-cell";
import { logError } from "@/lib/shared/logger";
import { extractSubjectFromFileName } from "@/lib/upload";
import { UploadButton } from "@/lib/uploadthing";

export default function UploadPage() {
	const [lastUploadUrl, setLastUploadUrl] = useState<string | null>(null);
	const [syncStatus, setSyncStatus] = useState<
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
		files: { url: string; name: string; ufsUrl?: string }[],
	) => {
		const urls = files.map((f) => f.ufsUrl ?? f.url);
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
		<div className="min-h-dvh bg-[--system-grouped-background]">
			<PageContainer>
				<div className="pt-safe pb-[--space-2]">
					<h1 className="ios-large-title text-[--system-text-primary]">
						Upload QA Files
					</h1>
				</div>

				<div className="flex flex-col gap-[--space-4] pb-[--space-8]">
					<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
						<header>
							<h2 className="flex flex-col items-center gap-3 text-center font-medium font-sans text-sm">
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
									logError("Upload", error);
								}}
							/>

							{lastUploadUrl && (
								<div className="rounded-(--radius-button) bg-[var(--success)]/10 p-[--space-4] text-center">
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
									<p className="ios-footnote font-medium text-[var(--success)]">
										Upload successful
									</p>
									<p className="ios-caption-1 mt-1 break-all text-muted-foreground">
										{lastUploadUrl}
									</p>
								</div>
							)}
							{syncStatus !== "idle" && (
								<div
									className={`rounded-(--radius-button) p-[--space-3] text-center text-xs ${
										syncStatus === "syncing"
											? "bg-accent/10 text-accent"
											: syncStatus === "done"
												? "bg-success/10 text-success"
												: "bg-destructive/10 text-destructive"
									}`}
								>
									{syncStatus === "syncing"
										? "Syncing subject data..."
										: syncStatus === "done"
											? "Subject data synced"
											: "Sync failed"}
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
							<h2 className="flex items-center gap-2 font-medium font-sans text-sm">
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
