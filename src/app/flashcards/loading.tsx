export default function FlashcardsLoading() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-pulse">
			<div className="h-48 w-80 rounded-2xl bg-muted" />
			<div className="h-4 w-32 rounded bg-muted" />
		</div>
	);
}
