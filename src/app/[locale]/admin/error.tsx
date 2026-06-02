"use client";

export default function AdminError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
			<h2 className="font-semibold text-xl">Admin error</h2>
			<p className="max-w-md text-center text-muted-foreground text-sm">
				{error?.message || "Something went wrong in the admin panel."}
			</p>
			<button
				type="button"
				onClick={() => reset()}
				className="rounded-lg bg-system-accent px-4 py-2 font-semibold text-sm text-white hover:bg-system-accent/90"
			>
				Try again
			</button>
		</div>
	);
}
