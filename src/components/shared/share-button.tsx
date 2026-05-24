"use client";

import { Share08Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ShareCardParams } from "@/lib/share/card-generator";
import { generateShareCard } from "@/lib/share/card-generator";

interface ShareButtonProps {
	cardParams: ShareCardParams;
	text: string;
	onShare?: () => void;
	label?: string;
}

export function ShareResultButton({
	cardParams,
	text,
	onShare,
	label = "Share Result",
}: ShareButtonProps) {
	const [loading, setLoading] = useState(false);

	async function handleShare() {
		setLoading(true);
		try {
			let blob: Blob | undefined;
			try {
				blob = await generateShareCard(cardParams);
			} catch {
				blob = undefined;
			}

			const shareData: ShareData = { text };

			if (blob && navigator.canShare?.({ files: [new File([blob], "result.png", { type: "image/png" })] })) {
				shareData.files = [new File([blob], "result.png", { type: "image/png" })];
			}

			if (navigator.share) {
				await navigator.share(shareData);
			} else {
				await navigator.clipboard.writeText(text);
				const link = document.createElement("a");
				link.download = `result-${cardParams.type}-${Date.now()}.png`;
				if (blob) {
					link.href = URL.createObjectURL(blob);
					link.click();
					URL.revokeObjectURL(link.href);
				}
			}

			onShare?.();
		} catch {
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(text);
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<Button
			variant="outline"
			onClick={handleShare}
			disabled={loading}
			className="gap-2"
		>
			<HugeiconsIcon icon={Share08Icon} className="size-4" />
			{loading ? "Generating..." : label}
		</Button>
	);
}
