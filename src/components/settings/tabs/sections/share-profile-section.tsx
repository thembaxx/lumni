"use client";

import { Copy01Icon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { toast } from "@/hooks/use-toast";

interface ShareProfileSectionProps {
	userId: string | undefined;
}

export function ShareProfileSection({ userId }: ShareProfileSectionProps) {
	const shareLeading = useMemo(
		() => <HugeiconsIcon icon={LinkSquare01Icon} className="size-5" />,
		[],
	);
	const shareTrailing = useMemo(
		() => (
			<button
				type="button"
				onClick={async () => {
					if (userId) {
						await navigator.clipboard.writeText(userId);
						toast({
							type: "success",
							message: "User ID copied to clipboard",
						});
					}
				}}
				className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-accent text-white hover:bg-system-accent/90"
				aria-label="Copy user ID"
			>
				<HugeiconsIcon icon={Copy01Icon} className="size-4" />
			</button>
		),
		[userId],
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
