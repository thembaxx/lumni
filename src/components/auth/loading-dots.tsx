export function LoadingDots() {
	return (
		<span className="inline-flex gap-0.5">
			<span
				className="size-1.5 animate-bounce rounded-full bg-current"
				style={{ animationDelay: "0ms" }}
			/>
			<span
				className="size-1.5 animate-bounce rounded-full bg-current"
				style={{ animationDelay: "150ms" }}
			/>
			<span
				className="size-1.5 animate-bounce rounded-full bg-current"
				style={{ animationDelay: "300ms" }}
			/>
		</span>
	);
}
