"use client";

import { motion } from "framer-motion";
import { LoadingScreen } from "@/components/loading";
import { appConfig } from "../../../app.config";

export function HomeContent() {
	return (
		<div className="min-h-[100dvh] bg-[--system-background]">
			<div className="grid grid-cols-12 gap-0 min-h-[100dvh]">
				<main className="col-span-12 md:col-span-7 col-start-1 flex flex-col justify-center px-[--space-8] py-[--space-10] md:px-[--space-12] md:py-[--space-14]">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, ease: "easeOut" }}
						className="flex flex-col gap-[--space-6]"
					>
						<div className="flex flex-col gap-[--space-3]">
							<h1 className="ios-large-title font-extrabold text-[--system-text-primary] tracking-tighter">
								lumni
							</h1>
							<p className="ios-callout text-[--system-text-secondary] max-w-sm leading-relaxed">
								{appConfig.descriptionShort}
							</p>
						</div>
						<LoadingScreen duration={2000} redirectTo="/dashboard" />
					</motion.div>
				</main>

				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.8, delay: 0.3 }}
						className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent"
					/>
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-system-accent/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		</div>
	);
}
