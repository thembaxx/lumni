import { cn } from "@/lib/utils";

export function LoadingDots() {
	return (
		<span className="inline-flex gap-0.5">
			<span
				className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
				style={{ animationDelay: "0ms" }}
			/>
			<span
				className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
				style={{ animationDelay: "150ms" }}
			/>
			<span
				className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
				style={{ animationDelay: "300ms" }}
			/>
		</span>
	);
}
