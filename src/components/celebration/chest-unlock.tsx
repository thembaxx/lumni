"use client";

import { AnimatePresence, m } from "framer-motion";
import {
	rarityBorder,
	rarityGlowStrong,
	raritySolid,
} from "@/lib/utils/gamification";

interface ChestUnlockProps {
	visible: boolean;
	icon: string;
	name: string;
	description: string;
	xpReward: number;
	rarity: "common" | "rare" | "epic" | "legendary";
	onClose?: () => void;
}

export function ChestUnlock({
	visible,
	icon,
	name,
	description,
	xpReward,
	rarity,
	onClose,
}: ChestUnlockProps) {
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
						initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
						animate={{ opacity: 1, scale: 1, rotate: 0 }}
						exit={{ opacity: 0, scale: 0.8, rotate: -10 }}
						transition={{ type: "spring", stiffness: 400, damping: 15 }}
						className="relative"
						onClick={(e) => e.stopPropagation()}
					>
						<div
							className={`absolute inset-0 rounded-3xl blur-xl ${rarityGlowStrong[rarity as keyof typeof rarityGlowStrong]}`}
						/>
						<div
							className={`relative flex flex-col items-center gap-4 rounded-3xl border-2 bg-background p-8 text-center shadow-level-2 ${rarityBorder[rarity as keyof typeof rarityBorder]}`}
						>
							<div
								className={`flex size-16 items-center justify-center rounded-full text-3xl ${raritySolid[rarity as keyof typeof raritySolid]}`}
							>
								{icon}
							</div>
							<div>
								<p className="font-bold text-lg">Reward Chest Unlocked!</p>
								<p className="text-xl">{name}</p>
								<p className="mt-1 text-muted-foreground text-sm">
									{description}
								</p>
							</div>
							<div className="flex items-center gap-2 text-amber-400 dark:text-amber-300">
								<span className="font-bold text-2xl">+{xpReward}</span>
								<span className="text-sm">XP</span>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="mt-2 rounded-xl bg-accent px-6 py-2 font-medium text-accent-foreground text-sm transition-colors hover:bg-accent/80"
							>
								Claim
							</button>
						</div>
					</m.div>
				</m.div>
			)}
		</AnimatePresence>
	);
}
