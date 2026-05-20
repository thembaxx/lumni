"use client";

import type { Metadata } from "next";
import { Anim } from "@/components/shared/anim";
import { AiSolver } from "@/components/tools/ai-solver";

export const metadata: Metadata = {
	title: "Solve",
};

export default function SolvePage() {
	return (
		<div className="min-h-[100dvh] bg-system-grouped pt-4 pb-24">
			<div className="mx-auto w-full max-w-3xl px-4">
				<Anim>
					<div className="flex flex-col gap-6">
						<div>
							<h1 className="ios-title-1 font-semibold text-foreground tracking-tight">
								AI Solver
							</h1>
							<p className="ios-subhead mt-1.5 text-muted-foreground/60">
								Snap a photo of your homework or type a question to get
								step-by-step help.
							</p>
						</div>
						<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-level-2">
							<AiSolver />
						</div>
					</div>
				</Anim>
			</div>
		</div>
	);
}
