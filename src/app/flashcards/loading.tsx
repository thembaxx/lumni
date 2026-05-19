export default function FlashcardsLoading() {
	return (
		<div className="flex min-h-[60vh] animate-pulse flex-col items-center justify-center gap-4">
			<div className="h-48 w-80 rounded-2xl bg-muted" />
			<div className="h-4 w-32 rounded bg-muted" />
		</div>
	);
}
