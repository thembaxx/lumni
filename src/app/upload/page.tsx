"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";

function formatSubjectName(subject: string): string {
	return subject.replace(/\s+/g, "_").toLowerCase();
}

function _generateFileName(subject: string, number: number): string {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

export default function UploadPage() {
	const [_uploadedUrls, setUploadedUrls] = useState<string[]>([]);
	const [lastUpload, setLastUpload] = useState<string | null>(null);

	const handleUploadComplete = (files: { url: string; name: string }[]) => {
		const urls = files.map((f) => f.url);
		setUploadedUrls(urls);
		setLastUpload(urls[0] || null);
		alert(`Uploaded successfully!\n\nFile: ${files[0]?.name}\nURL: ${urls[0]}`);
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

			<UploadButton
				endpoint="qaUploader"
				onClientUploadComplete={handleUploadComplete}
				onUploadError={(error: Error) => {
					console.error("Upload error:", error);
					alert(`Error: ${error.message}`);
				}}
			/>

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
