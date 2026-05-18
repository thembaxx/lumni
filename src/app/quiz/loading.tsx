import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function QuizLoading() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
			<HugeiconsIcon
				icon={RadialIcon}
				className="size-10 text-system-accent animate-spin"
			/>
			<p className="text-muted-foreground text-sm">Preparing your quiz...</p>
		</div>
	);
}
