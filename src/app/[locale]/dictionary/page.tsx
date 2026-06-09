import type { Metadata } from "next";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { DictionaryClient } from "./dictionary-client";

export const metadata: Metadata = {
	title: "Dictionary - Lumni",
	description: "Look up word definitions, pronunciations, and examples",
};

export default function DictionaryPage() {
	return (
		<AppErrorBoundary>
			<Suspense
				fallback={
					<div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pt-8">
						<Skeleton className="h-10 w-48 rounded-2xl" />
						<Skeleton className="h-12 w-full rounded-3xl" />
						<Skeleton className="h-64 w-full rounded-3xl" />
					</div>
				}
			>
				<DictionaryClient />
			</Suspense>
		</AppErrorBoundary>
	);
}
