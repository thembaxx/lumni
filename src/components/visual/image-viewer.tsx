"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useState } from "react";

interface ImageViewerProps {
	url: string;
	label: string;
	attribution?: string;
	sourceUrl?: string;
}

export function ImageViewer({
	url,
	label,
	attribution,
	sourceUrl,
}: ImageViewerProps) {
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true);

	if (error) {
		return (
			<div className="flex h-40 items-center justify-center rounded-lg border bg-muted/20 text-sm text-muted-foreground">
				Could not load image
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1">
			<div className="relative overflow-hidden rounded-lg border bg-background/20 min-h-48">
				{loading && (
					<div className="absolute inset-0 flex items-center justify-center bg-muted/10">
						<div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
					</div>
				)}
				<Image
					src={url}
					alt={label}
					fill
					sizes="100vw"
					unoptimized
					className="object-contain max-h-96 !relative outline -outline-offset-1 outline-black/10 dark:outline-white/10"
					onLoad={() => setLoading(false)}
					onError={() => {
						setError(true);
						setLoading(false);
					}}
					style={loading ? { display: "none" } : undefined}
				/>
			</div>
			{attribution && (
				<p className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
					<span>{attribution}</span>
					{sourceUrl && (
						<a
							href={sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-0.5 hover:text-muted-foreground"
						>
							<HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3" />
						</a>
					)}
				</p>
			)}
		</div>
	);
}
