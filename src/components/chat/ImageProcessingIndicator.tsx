import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
		<motion.div
			initial={{ opacity: 0, y: -8, scaleY: 0.8 }}
			animate={{ opacity: 1, y: 0, scaleY: 1 }}
			exit={{ opacity: 0, y: -8, scaleY: 0.8 }}
			transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
			style={{ transformOrigin: "top" }}
			className={cn(
				"px-3 py-2 rounded-lg border text-sm",
				isError
					? "bg-destructive/10 border-destructive/30 text-destructive"
					: "bg-secondary/60 border-border/30 text-foreground",
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
							className="w-6 h-6 shrink-0"
							aria-label="Dismiss error"
						>
							<X className="w-3 h-3" />
						</Button>
					</>
				) : (
					<>
						<div className="w-4 h-4 shrink-0">
							<div className="w-4 h-4 border-2 border-[--system-accent] border-t-transparent rounded-full animate-spin" />
						</div>
						<span className="flex-1 truncate text-xs">
							{state.progressMessage}
						</span>
						{state.status !== "success" && (
							<span className="text-xs tabular-nums text-muted-foreground">
								{state.progress}%
							</span>
						)}
					</>
				)}
			</div>
			{state.status !== "error" && state.status !== "success" && (
				<Progress
					value={state.progress}
					className="h-1 mt-1.5 [&>div]:bg-[--system-accent]"
				/>
			)}
		</motion.div>
	);
}
