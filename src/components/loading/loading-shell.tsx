"use client";

import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface LoadingShellProps {
	children: ReactNode;
}

export function LoadingShell({ children }: LoadingShellProps) {
	const reducedMotion = useReducedMotion();

	return (
		<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
			<div className="col-span-12 col-start-1 flex items-center justify-center p-[--space-8] md:col-span-7 md:p-[--space-12]">
				{children}
			</div>
			<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
				<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div
						className={`aspect-square h-full w-full max-w-xs rounded-3xl bg-[--system-accent]/10 blur-2xl ${reducedMotion ? "opacity-60" : "animate-float-slow"}`}
					/>
					{!reducedMotion && (
						<div className="absolute top-[15%] left-[10%] aspect-square h-2/3 w-2/3 max-w-48 animate-blob-orbit rounded-full bg-[--system-accent]/6 blur-xl" />
					)}
				</div>
			</div>
		</div>
	);
}
