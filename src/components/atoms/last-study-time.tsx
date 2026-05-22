"use client";

import { Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/shared";

interface LastStudyTimeProps extends React.ComponentProps<"span"> {
	timestamp: string | Date;
}

export function LastStudyTime({
	timestamp,
	className,
	...props
}: LastStudyTimeProps) {
	const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
	const relative = formatDistanceToNow(date, { addSuffix: true });

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 text-muted-foreground text-xs",
				className,
			)}
			{...props}
		>
			<HugeiconsIcon icon={Clock01Icon} size={14} />
			{relative}
		</span>
	);
}
