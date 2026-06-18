"use client";

import { Button } from "@/components/ui/button";

export default function RouteError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
			<h2 className="font-bold text-lg">Something went wrong</h2>
			<p className="max-w-md text-muted-foreground text-sm">
				{error?.message || "An unexpected error occurred."}
			</p>
			<Button onClick={() => reset()}>Try again</Button>
		</div>
	);
}
