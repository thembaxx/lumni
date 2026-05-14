"use client";

import { SpinnerGap } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface SessionLoadingProps {}

export function SessionLoading() {
	return (
		<div className="min-h-[100dvh] bg-background grid grid-cols-12 gap-0">
			<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4">
				<Card className="max-w-md w-full mx-auto">
					<CardContent className="p-8 text-left">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
							className="size-24 mx-auto"
						>
							<SpinnerGap className="size-24 text-muted-foreground" />
						</motion.div>
					</CardContent>
				</Card>
			</div>
			<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
				<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-[--system-accent]/10 blur-2xl animate-float-slow" />
				</div>
			</div>
		</div>
	);
}
