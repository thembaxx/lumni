"use client";

import CrownIcon from "@hugeicons/core-free-icons/CrownIcon";
import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface LevelUpProps {
	visible: boolean;
	level: number;
	title: string;
	xpToNext: number;
	onClose?: () => void;
}

export function LevelUp({
	visible,
	level,
	title,
	xpToNext,
	onClose,
}: LevelUpProps) {
	return (
		<Dialog open={visible} onOpenChange={(o) => !o && onClose?.()}>
			<DialogContent showCloseButton={false} className="max-w-sm sm:max-w-sm">
				<DialogTitle className="sr-only">Level Up</DialogTitle>
				<m.div
					initial={{ scale: 0.5, y: 100 }}
					animate={{ scale: 1, y: 0 }}
					transition={{ type: "spring", stiffness: 300, damping: 26 }}
					className="relative w-full max-w-sm motion-reduce:animate-none motion-reduce:transition-none"
				>
					<m.div
						className="absolute inset-0 rounded-3xl bg-warning opacity-40 blur-xl"
						animate={{
							scale: [1, 1.1, 1],
							opacity: [0.6, 0.8, 0.6],
						}}
						transition={{ duration: 2, repeat: Infinity }}
					/>

					<div className="relative rounded-3xl border-2 border-warning bg-card p-8 text-center shadow-level-3 shadow-warning/30">
						<m.div
							initial={{ y: -30, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.2 }}
							className="mb-4"
						>
							<m.div
								animate={{ rotate: [0, 10, -10, 0] }}
								transition={{ duration: 0.5, repeat: 3 }}
							>
								<HugeiconsIcon
									icon={CrownIcon}
									className="mx-auto size-16 text-warning"
								/>
							</m.div>
						</m.div>

						<m.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
						>
							<p className="mb-2 font-medium text-warning uppercase tracking-wider">
								Level Up!
							</p>
							<m.div
								className="mb-4 inline-flex items-center gap-2 rounded-full bg-warning px-8 py-3 text-primary-foreground"
								initial={{ scale: 0.8 }}
								animate={{ scale: 1 }}
								transition={{ delay: 0.4, type: "spring" }}
							>
								<HugeiconsIcon icon={StarIcon} className="size-6 fill-white" />
								<span className="font-extrabold text-4xl tabular-nums">
									{level}
								</span>
							</m.div>
							<h2 className="balance mb-2 text-wrap font-semibold text-2xl">
								{title}
							</h2>
							<p className="mb-4 text-muted-foreground">
								{xpToNext > 0
									? `${xpToNext} XP to next level`
									: "Maximum level reached!"}
							</p>
						</m.div>
					</div>
				</m.div>
			</DialogContent>
		</Dialog>
	);
}
