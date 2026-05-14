"use client";

import { useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface LoadingShellProps {
	children: ReactNode;
}

export function LoadingShell({ children }: LoadingShellProps) {
	const reducedMotion = useReducedMotion();

	return (
		<div className="min-h-[100dvh] bg-background grid grid-cols-12 gap-0">
			<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-[--space-8] md:p-[--space-12]">
				{children}
			</div>
			<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
				<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div
						className={`w-full h-full max-w-xs aspect-square rounded-3xl bg-[--system-accent]/10 blur-2xl ${reducedMotion ? "opacity-60" : "animate-float-slow"}`}
					/>
					{!reducedMotion && (
						<div className="absolute w-2/3 h-2/3 max-w-[200px] top-[15%] left-[10%] aspect-square rounded-full bg-[--system-accent]/6 blur-xl animate-blob-orbit" />
					)}
				</div>
			</div>
		</div>
	);
}
