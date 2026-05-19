"use client";

export default function ExamError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
			<h2 className="text-xl font-semibold">Exam error</h2>
			<p className="text-muted-foreground text-sm max-w-md text-center">
				{error.message || "Something went wrong loading the exam."}
			</p>
			<button
				onClick={() => reset()}
				className="px-4 py-2 rounded-lg bg-system-accent text-white text-sm font-semibold hover:bg-system-accent/90"
			>
				Try again
			</button>
		</div>
	);
}
