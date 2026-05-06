import type { Metadata } from "next";
import { LoadingScreen } from "@/components/loading";
import { appConfig } from "../../app.config";

export const metadata: Metadata = {
	title: "Pass your Matric with confidence",
	description: appConfig.description,
};

export default function Home() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-background">
			<main className="flex flex-col items-center gap-10">
				<div className="flex flex-col items-center gap-4 animate-fade-in-up">
					<h1 className="text-5xl font-medium tracking-tight text-foreground">
						lumni
					</h1>
					<p className="text-muted-foreground text-base max-w-xs text-center leading-relaxed">
						{appConfig.descriptionShort}
					</p>
				</div>
				<LoadingScreen duration={2000} redirectTo="/dashboard" />
			</main>
		</div>
	);
}
