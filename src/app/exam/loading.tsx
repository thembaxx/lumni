export default function ExamLoading() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-pulse">
			<div className="h-8 w-64 rounded-lg bg-muted" />
			<div className="h-64 w-full max-w-2xl rounded-2xl bg-muted" />
		</div>
	);
}
