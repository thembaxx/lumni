import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

interface ImageProcessingIndicatorProps {
	state: {
		status: string;
		progress: number;
		progressMessage: string;
		error: string | null;
	};
	onDismiss: () => void;
}

export function ImageProcessingIndicator({
	state,
	onDismiss,
}: ImageProcessingIndicatorProps) {
	if (state.status === "idle") return null;

	const isError = state.status === "error";

	return (
		<m.div
			initial={{ opacity: 0, y: -8, scaleY: 0.8 }}
			animate={{ opacity: 1, y: 0, scaleY: 1 }}
			exit={{ opacity: 0, y: -8, scaleY: 0.8 }}
			transition={{ duration: 0.2, ease: iOSEase }}
			style={{ transformOrigin: "top" }}
			className={cn(
				"rounded-lg border px-3 py-2 text-sm",
				isError
					? "border-destructive/30 bg-destructive/10 text-destructive"
					: "border-border/30 bg-secondary/60 text-foreground",
			)}
		>
			<div className="flex items-center gap-2">
				{isError ? (
					<>
						<span className="flex-1 truncate text-xs">{state.error}</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={onDismiss}
							className="size-6 shrink-0"
							aria-label="Dismiss error"
						>
							<HugeiconsIcon icon={Cancel01Icon} data-icon />
						</Button>
					</>
				) : (
					<>
						<div className="size-4 shrink-0">
							<div className="size-4 animate-spin rounded-full border-2 border-[--system-accent] border-t-transparent" />
						</div>
						<span className="flex-1 truncate text-xs">
							{state.progressMessage}
						</span>
						{state.status !== "success" && (
							<span className="text-muted-foreground text-xs tabular-nums">
								{state.progress}%
							</span>
						)}
					</>
				)}
			</div>
			{state.status !== "error" && state.status !== "success" && (
				<Progress
					value={state.progress}
					className="mt-1.5 h-1 [&>div]:bg-[--system-accent]"
				/>
			)}
		</m.div>
	);
}
