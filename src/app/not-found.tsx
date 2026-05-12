import Link from "next/link";
import { Button } from "@/components/ui/button";
import { appConfig } from "../../app.config";

export default function NotFound() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-[--system-background]">
			<main className="flex flex-col items-center gap-[--space-6] text-center px-[--space-4]">
				<div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
					<svg
						className="size-8 text-muted-foreground"
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
				<div className="space-y-[--space-2]">
					<h2 className="ios-title-2 text-[--system-text-primary]">
						Page not found
					</h2>
					<p className="ios-callout text-[--system-text-secondary]">
						The page you&apos;re looking for doesn&apos;t exist or has been
						moved.
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
