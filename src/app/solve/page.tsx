"use client";

import { Anim } from "@/components/shared/anim";
import { AiSolver } from "@/components/tools/ai-solver";

export default function SolvePage() {
	return (
		<div className="min-h-[100dvh] bg-system-grouped pt-4 pb-24">
			<div className="max-w-3xl mx-auto w-full px-4">
				<Anim>
					<div className="flex flex-col gap-6">
						<div>
							<h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">
								AI Solver
							</h1>
							<p className="ios-subhead text-muted-foreground/60 mt-1.5">
								Snap a photo of your homework or type a question to get
								step-by-step help.
							</p>
						</div>
						<div className="bg-card rounded-2xl border border-border shadow-level-2 overflow-hidden">
							<AiSolver />
						</div>
					</div>
				</Anim>
			</div>
		</div>
	);
}
