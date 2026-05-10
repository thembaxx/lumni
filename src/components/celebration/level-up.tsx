"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, Star } from "lucide-react";
import { LottieWrapper } from "@/components/lottie";

interface LevelUpProps {
	visible: boolean;
	level: number;
	title: string;
	xpToNext: number;
	onClose?: () => void;
	useLottie?: boolean;
}

export function LevelUp({
	visible,
	level,
	title,
	xpToNext,
	onClose,
	useLottie = false,
}: LevelUpProps) {
	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.5, y: 100 }}
						animate={{ scale: 1, y: 0 }}
						exit={{ scale: 0.5, y: 100 }}
						transition={{ type: "spring", stiffness: 300, damping: 15 }}
						className="relative max-w-sm w-full"
						onClick={(e) => e.stopPropagation()}
					>
						<motion.div
							className="absolute inset-0 rounded-3xl bg-amber-500 blur-xl opacity-40"
							animate={{
								scale: [1, 1.1, 1],
								opacity: [0.6, 0.8, 0.6],
							}}
							transition={{ duration: 2, repeat: Infinity }}
						/>

						<div className="relative bg-card border-2 border-amber-500 rounded-3xl p-8 text-center shadow-2xl shadow-amber-500/30">
							<motion.div
								initial={{ y: -30, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.2 }}
								className="mb-4"
							>
								{useLottie ? (
									<LottieWrapper
										animation="level-up"
										className="w-24 h-24 mx-auto"
									/>
								) : (
									<motion.div
										animate={{ rotate: [0, 10, -10, 0] }}
										transition={{ duration: 0.5, repeat: 3 }}
									>
										<Crown className="w-16 h-16 mx-auto text-amber-500" />
									</motion.div>
								)}
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
							>
								<p className="text-amber-500 font-medium uppercase tracking-wider mb-2">
									Level Up!
								</p>
								<motion.div
									className="inline-flex items-center gap-2 bg-amber-500 text-white px-8 py-3 rounded-full mb-4"
									initial={{ scale: 0.8 }}
									animate={{ scale: 1 }}
									transition={{ delay: 0.4, type: "spring" }}
								>
									<Star className="w-6 h-6 fill-white" />
									<span className="text-4xl font-bold">{level}</span>
								</motion.div>
								<h2 className="text-2xl font-bold mb-2">{title}</h2>
								<p className="text-muted-foreground mb-4">
									{xpToNext > 0
										? `${xpToNext} XP to next level`
										: "Maximum level reached!"}
								</p>
							</motion.div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
