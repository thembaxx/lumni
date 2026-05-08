"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html>
			<body
				className="min-h-screen flex flex-col items-center justify-center bg-background px-4"
				suppressHydrationWarning
			>
				<main className="flex flex-col items-center gap-8 text-center max-w-md">
					<div className="relative">
						<div className="absolute inset-0 animate-pulse rounded-full bg-destructive/10 blur-xl" />
						<div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20">
							<AlertTriangle className="w-10 h-10 text-destructive" />
						</div>
					</div>

					<div className="space-y-2">
						<h2 className="text-2xl font-semibold text-foreground">
							Something went wrong
						</h2>
						<p className="text-muted-foreground text-sm max-w-md">
							{error.message ||
								"An unexpected error occurred. Please try again."}
						</p>
						{error.digest && (
							<p className="text-xs text-muted-foreground/60 font-mono">
								Error ID: {error.digest}
							</p>
						)}
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						<Button onClick={() => reset()} className="gap-2">
							<RefreshCw className="w-4 h-4" />
							Try again
						</Button>
						<Button
							variant="outline"
							onClick={() => (window.location.href = "/")}
							className="gap-2"
						>
							<Home className="w-4 h-4" />
							Go Home
						</Button>
					</div>

					<p className="text-xs text-muted-foreground/50">
						If this persists, please contact support.
					</p>
				</main>
			</body>
		</html>
	);
}
