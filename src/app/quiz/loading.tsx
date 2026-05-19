import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function QuizLoading() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
			<HugeiconsIcon
				icon={RadialIcon}
				className="size-10 animate-spin text-system-accent"
			/>
			<p className="text-muted-foreground text-sm">Preparing your quiz...</p>
		</div>
	);
}
