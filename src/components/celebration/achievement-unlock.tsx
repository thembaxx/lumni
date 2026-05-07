"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface AchievementUnlockProps {
	visible: boolean;
	icon: string;
	name: string;
	description: string;
	xpReward: number;
	rarity: "common" | "rare" | "epic" | "legendary";
	onClose?: () => void;
}

const rarityColors = {
	common: "from-gray-400 to-gray-500",
	rare: "from-blue-400 to-blue-600",
	epic: "from-purple-400 to-purple-600",
	legendary: "from-amber-400 to-orange-500",
};

const rarityGlow = {
	common: "shadow-gray-500/50",
	rare: "shadow-blue-500/50",
	epic: "shadow-purple-500/50",
	legendary: "shadow-amber-500/70",
};

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
		<AnimatePresence>
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
							className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${rarityColors[rarity]} blur-xl opacity-50`}
						/>

						<div
							className={`relative bg-card border-2 border-${rarity === "legendary" ? "amber-500" : rarity === "epic" ? "purple-500" : rarity === "rare" ? "blue-500" : "gray-400"} rounded-3xl p-8 text-center shadow-2xl ${rarityGlow[rarity]}`}
						>
							<motion.div
								initial={{ scale: 0, rotate: -180 }}
								animate={{ scale: 1, rotate: 0 }}
								transition={{ type: "spring", delay: 0.2 }}
								className="mb-4"
							>
								<div className="text-7xl mb-4">{icon}</div>
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
							>
								<div className="flex items-center justify-center gap-2 mb-2">
									<Trophy className="w-5 h-5 text-amber-500" />
									<span className="text-sm font-medium text-amber-500 uppercase tracking-wider">
										Achievement Unlocked!
									</span>
								</div>
								<h2 className="text-2xl font-bold mb-2">{name}</h2>
								<p className="text-muted-foreground mb-4">{description}</p>
								<div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-600 px-4 py-2 rounded-full">
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
