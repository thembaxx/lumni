"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { LottieWrapper } from "@/components/lottie";

interface AchievementUnlockProps {
	visible: boolean;
	icon: string;
	name: string;
	description: string;
	xpReward: number;
	rarity: "common" | "rare" | "epic" | "legendary";
	onClose?: () => void;
	useLottie?: boolean;
}

const raritySolid = {
	common: "bg-muted",
	rare: "bg-[--system-accent]",
	epic: "bg-purple-500 dark:bg-purple-700",
	legendary: "bg-amber-500 dark:bg-amber-700",
};

const rarityGlow = {
	common: "shadow-gray-500/50 dark:shadow-gray-700/50",
	rare: "shadow-[--system-accent]/50",
	epic: "shadow-purple-500/50 dark:shadow-purple-700/50",
	legendary: "shadow-amber-500/70 dark:shadow-amber-700/70",
};

const rarityBorder = {
	common: "border-gray-400 dark:border-gray-600",
	rare: "border-[--system-accent]",
	epic: "border-purple-500 dark:border-purple-700",
	legendary: "border-amber-500 dark:border-amber-700",
};

export function AchievementUnlock({
	visible,
	icon,
	name,
	description,
	xpReward,
	rarity,
	onClose,
	useLottie = false,
}: AchievementUnlockProps) {
	return (
		<AnimatePresence initial={false}>
			{visible && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0, y: 50 }}
						animate={{ scale: 1, y: 0 }}
						exit={{ scale: 0, y: 50 }}
						transition={{ type: "spring", stiffness: 300, damping: 20 }}
						className="relative"
						onClick={(e) => e.stopPropagation()}
					>
						<div
							className={`absolute inset-0 rounded-3xl bg-opacity-50 blur-xl ${raritySolid[rarity]}`}
						/>

						<div
							className={`relative bg-card border-2 ${rarityBorder[rarity]} rounded-3xl p-8 text-center shadow-2xl ${rarityGlow[rarity]}`}
						>
							<motion.div
								initial={{ scale: 0, rotate: -180 }}
								animate={{ scale: 1, rotate: 0 }}
								transition={{ type: "spring", delay: 0.2 }}
								className="mb-4"
							>
								{useLottie ? (
									<LottieWrapper
										animation="achievement-unlock"
										className="w-32 h-32 mx-auto"
									/>
								) : (
									<div className="text-7xl mb-4">{icon}</div>
								)}
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
							>
								<div className="flex items-center justify-center gap-2 mb-2">
									<Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
									<span className="text-sm font-medium text-amber-500 uppercase tracking-wider dark:text-amber-400">
										Achievement Unlocked!
									</span>
								</div>
								<h2 className="text-2xl font-bold mb-2 text-wrap balance">
									{name}
								</h2>
								<p className="text-muted-foreground mb-4">{description}</p>
								<div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-600 px-4 py-2 rounded-full dark:bg-amber-700/30 dark:text-amber-300">
									<span className="text-lg font-bold">+{xpReward} XP</span>
								</div>
							</motion.div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
