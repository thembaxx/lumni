"use client";

import { Award01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
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
				<m.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4"
					onClick={onClose}
				>
					<m.div
						initial={{ opacity: 0, scale: 0.95, y: 50 }}
						animate={{ scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 50 }}
						transition={{ type: "spring", stiffness: 300, damping: 20 }}
						className="relative"
						onClick={(e) => e.stopPropagation()}
					>
						<div
							className={`absolute inset-0 rounded-3xl bg-opacity-50 blur-xl ${raritySolid[rarity]}`}
						/>

						<div
							className={`relative border-2 bg-card ${rarityBorder[rarity]} rounded-3xl p-8 text-center shadow-2xl ${rarityGlowStrong[rarity]}`}
						>
							<m.div
								initial={{ opacity: 0, scale: 0.95, rotate: -180 }}
								animate={{ scale: 1, rotate: 0 }}
								transition={{ type: "spring", delay: 0.2 }}
								className="mb-4"
							>
								<m.div
									animate={{ scale: [0.95, 1.2, 1] }}
									transition={{ duration: 0.3 }}
								>
									<div className="mb-4 text-7xl">{icon}</div>
								</m.div>
							</m.div>

							<m.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
							>
								<div className="mb-2 flex items-center justify-center gap-2">
									<HugeiconsIcon
										icon={Award01Icon}
										className="size-5 text-warning"
									/>
									<span className="font-medium text-sm text-warning uppercase tracking-wider">
										Achievement Unlocked!
									</span>
								</div>
								<h2 className="balance mb-2 text-wrap font-semibold text-2xl">
									{name}
								</h2>
								<p className="mb-4 text-muted-foreground">{description}</p>
								<div className="inline-flex items-center gap-2 rounded-full bg-warning/20 px-4 py-2 text-warning-foreground">
									<span className="font-semibold text-lg">+{xpReward} XP</span>
								</div>
							</m.div>
						</div>
					</m.div>
				</m.div>
			)}
		</AnimatePresence>
	);
}
