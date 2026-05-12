import Link from "next/link";
import { Button } from "@/components/ui/button";
import { appConfig } from "../../app.config";

export default function NotFound() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-background">
			<main className="flex flex-col items-center gap-6 text-center px-4">
				<div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
					<svg
						className="w-8 h-8 text-muted-foreground"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<div className="space-y-2">
					<h2 className="text-xl font-semibold text-foreground">
						Page not found
					</h2>
					<p className="text-muted-foreground text-sm max-w-md">
						The page you're looking for doesn't exist or has been moved.
					</p>
				</div>
				<Link href="/">
					<Button className="bg-[--system-accent] text-background hover:bg-[--system-accent]/80">
						Back to {appConfig.name}
					</Button>
				</Link>
			</main>
		</div>
	);
}
