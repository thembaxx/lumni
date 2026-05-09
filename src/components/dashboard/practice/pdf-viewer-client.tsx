"use client";

import dynamic from "next/dynamic";

export const PdfViewer = dynamic(
	() =>
		import("./pdf-viewer").then((mod) => mod.PdfViewerImpl),
	{
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center h-full">
				<div className="flex flex-col items-center gap-2">
					<div className="w-5 h-5 rounded-full border border-muted border-t-foreground animate-spin" />
					<span className="text-xs text-muted-foreground">
						Loading PDF viewer...
					</span>
				</div>
			</div>
		),
	},
);