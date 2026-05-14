"use client";

import { Trophy } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import {
	rarityBorder,
	rarityGlowStrong,
	raritySolid,
} from "@/lib/utils/gamification";

interface AchievementUnlockProps {
	visible: boolean;
	icon: string;
	name: string;
	description: string;
	xpReward: number;
	rarity: "common" | "rare" | "epic" | "legendary";
	onClose?: () => void;
}

export function AchievementUnlock({
	visible,
	icon,
	name,
	description,
	xpReward,
	rarity,
	onClose,
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
							className={`relative bg-card border-2 ${rarityBorder[rarity]} rounded-3xl p-8 text-center shadow-2xl ${rarityGlowStrong[rarity]}`}
						>
							<motion.div
								initial={{ scale: 0, rotate: -180 }}
								animate={{ scale: 1, rotate: 0 }}
								transition={{ type: "spring", delay: 0.2 }}
								className="mb-4"
							>
								<motion.div
									animate={{ scale: [0, 1.2, 1] }}
									transition={{ duration: 0.3 }}
								>
									<div className="text-7xl mb-4">{icon}</div>
								</motion.div>
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
							>
								<div className="flex items-center justify-center gap-2 mb-2">
									<Trophy className="size-5 text-warning" />
									<span className="text-sm font-medium text-warning uppercase tracking-wider">
										Achievement Unlocked!
									</span>
								</div>
								<h2 className="text-2xl font-extrabold mb-2 text-wrap balance">
									{name}
								</h2>
								<p className="text-muted-foreground mb-4">{description}</p>
								<div className="inline-flex items-center gap-2 bg-warning/20 text-warning-foreground px-4 py-2 rounded-full">
									<span className="text-lg font-extrabold">+{xpReward} XP</span>
								</div>
							</motion.div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
