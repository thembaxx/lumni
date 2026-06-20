"use client";

import { Copy01Icon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { toast } from "@/hooks/use-toast";

interface ShareProfileSectionProps {
	userId: string | undefined;
}

export function ShareProfileSection({ userId }: ShareProfileSectionProps) {
	const [copying, setCopying] = useState(false);
	const shareLeading = useMemo(
		() => <HugeiconsIcon icon={LinkSquare01Icon} className="size-5" />,
		[],
	);
	const shareTrailing = useMemo(
		() => (
			<button
				type="button"
				onClick={async () => {
					if (userId && !copying) {
						setCopying(true);
						try {
							await navigator.clipboard.writeText(userId);
							toast({
								type: "success",
								message: "User ID copied to clipboard",
							});
						} catch {
							toast({
								type: "error",
								message: "Failed to copy",
							});
						} finally {
							setCopying(false);
						}
					}
				}}
				disabled={copying}
				className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-accent text-white hover:bg-system-accent/90 disabled:opacity-50"
				aria-label="Copy user ID"
			>
				<HugeiconsIcon icon={Copy01Icon} className="size-4" />
			</button>
		),
		[userId, copying],
	);

	return (
		<ListSection header="Share Profile">
			<ListCell
				leading={shareLeading}
				title="Your User ID"
				subtitle="Share this with your teacher or parent to link accounts"
				showSeparator={false}
				trailing={shareTrailing}
			/>
		</ListSection>
	);
}
