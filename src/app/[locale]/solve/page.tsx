"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Anim } from "@/components/shared/anim";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { AiSolver } from "@/components/tools/communication/ai-solver";
import { Skeleton } from "@/components/ui/skeleton";

function SolveContent() {
	const searchParams = useSearchParams();
	const initialQuestion = searchParams.get("question") ?? undefined;

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="ios-title-1 font-semibold text-foreground tracking-tight">
					AI Solver
				</h1>
				<p className="ios-subhead mt-1.5 text-muted-foreground/60">
					Snap a photo of your homework or type a question to get step-by-step
					help.
				</p>
			</div>
			<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-level-2">
				<AiSolver initialQuestion={initialQuestion} />
			</div>
		</div>
	);
}

export default function SolvePage() {
	return (
		<div className="min-h-dvh bg-system-grouped pt-4 pb-24">
			<PageContainer>
				<AppErrorBoundary>
					<Anim>
						<Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
							<SolveContent />
						</Suspense>
					</Anim>
				</AppErrorBoundary>
			</PageContainer>
		</div>
	);
}
