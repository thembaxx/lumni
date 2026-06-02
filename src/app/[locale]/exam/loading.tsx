export default function ExamLoading() {
	return (
		<div className="flex min-h-dvh animate-pulse flex-col items-center justify-center gap-4">
			<div className="h-8 w-64 rounded-lg bg-muted" />
			<div className="h-64 w-full max-w-2xl rounded-2xl bg-muted" />
		</div>
	);
}
