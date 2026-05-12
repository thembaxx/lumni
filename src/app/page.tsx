import type { Metadata } from "next";
import { LoadingScreen } from "@/components/loading";
import { appConfig } from "../../app.config";

export const metadata: Metadata = {
	title: "Pass your Matric with confidence",
	description: appConfig.description,
};

export default function Home() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-[--system-background]">
			<main className="flex flex-col items-center gap-[--space-10]">
				<div className="flex flex-col items-center gap-[--space-4] animate-fade-in-scale">
					<h1 className="ios-large-title font-bold text-[--system-text-primary]">
						lumni
					</h1>
					<p className="ios-callout text-[--system-text-secondary] max-w-xs text-center leading-relaxed">
						{appConfig.descriptionShort}
					</p>
				</div>
				<LoadingScreen duration={2000} redirectTo="/dashboard" />
			</main>
		</div>
	);
}
