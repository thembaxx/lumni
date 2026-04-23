"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Database, Loader2 } from "lucide-react";

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
				alert("Database seeded successfully!");
			} else {
				setSeedStatus("error");
				alert(`Seed failed: ${data.error}`);
			}
		} catch {
			setSeedStatus("error");
			alert("Seed failed: Network error");
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

		alert(
			`Uploaded successfully!\n\nFile: ${files[0]?.name}\nURL: ${urls[0]}${subject ? `\nSynced: ${syncStatus}` : ""}`,
		);
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
			<h1 className="text-2xl font-bold">Upload QA Files</h1>
			<div className="text-center space-y-2">
				<p className="text-muted-foreground">
					Upload JSON question files for subjects
				</p>
				<p className="text-sm text-muted-foreground">
					<strong>Convention:</strong> [subject]_qa_[number].json
				</p>
				<p className="text-xs text-muted-foreground">
					Example: physical_sciences_qa_1.json
				</p>
			</div>

			<div className="flex gap-4">
				<UploadButton
					endpoint="qaUploader"
					onClientUploadComplete={handleUploadComplete}
					onUploadError={(error: Error) => {
						console.error("Upload error:", error);
						alert(`Error: ${error.message}`);
					}}
				/>

				<Button
					variant="outline"
					onClick={handleSeedDatabase}
					disabled={seedStatus === "seeding"}
				>
					{seedStatus === "seeding" ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Database className="mr-2 h-4 w-4" />
					)}
					{seedStatus === "seeding"
						? "Seeding..."
						: seedStatus === "done"
							? "Seeded!"
							: "Seed Database"}
				</Button>
			</div>

			{lastUpload && (
				<div className="mt-8 p-4 bg-green-500/10 rounded-lg">
					<p className="font-medium text-green-700">Last Upload Successful!</p>
					<p className="text-sm text-muted-foreground break-all">
						{lastUpload}
					</p>
				</div>
			)}

			<div className="mt-8 text-center text-sm text-muted-foreground">
				<p>Or upload manually at:</p>
				<a
					href="https://uploadthing.com/dashboard"
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary hover:underline"
				>
					https://uploadthing.com/dashboard
				</a>
			</div>
		</div>
	);
}
