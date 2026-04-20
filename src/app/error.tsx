"use client";

import { Button } from "@/components/ui/button";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-background">
			<main className="flex flex-col items-center gap-6 text-center px-4">
				<div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
					<svg
						className="w-8 h-8 text-destructive"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div className="space-y-2">
					<h2 className="text-xl font-semibold text-foreground">
						Something went wrong
					</h2>
					<p className="text-muted-foreground text-sm max-w-md">
						{error.message || "An unexpected error occurred. Please try again."}
					</p>
				</div>
				<Button
					onClick={() => reset()}
					className="bg-primary text-primary-foreground hover:bg-primary/80"
				>
					Try again
				</Button>
			</main>
		</div>
	);
}
