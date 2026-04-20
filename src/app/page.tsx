import type { Metadata } from "next";
import { LoadingScreen } from "@/components/loading-screen";
import { appConfig } from "../../app.config";

export const metadata: Metadata = {
	title: "Pass your Matric with confidence",
	description: appConfig.description,
};

export default function Home() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-background">
			<main className="flex flex-col items-center gap-8">
				<h1 className="text-6xl font-light text-foreground tracking-tight">
					lumni
				</h1>
				<p className="text-muted-foreground text-sm">
					{appConfig.descriptionShort}
				</p>
				<LoadingScreen duration={2000} redirectTo="/dashboard" />
			</main>
		</div>
	);
}
