"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

interface AlertAction {
	label: string;
	onClick: () => void;
	variant?: "default" | "destructive" | "cancel";
}

interface AlertProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	message: string;
	actions: AlertAction[];
	className?: string;
}

function Alert({
	open,
	onOpenChange,
	title,
	message,
	actions,
	className,
}: AlertProps) {
	const iOSEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

	return (
		<AnimatePresence>
			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-8">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2, ease: iOSEase }}
						className="fixed inset-0 bg-black/40 dark:bg-black/60"
						onClick={() => onOpenChange(false)}
					/>
					<motion.div
						initial={{ opacity: 0, scale: 0.92 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.92 }}
						transition={{ duration: 0.25, ease: iOSEase }}
						className={cn(
							"relative w-full max-w-[270px] rounded-[22px] bg-[--system-surface] p-0 shadow-[--shadow-level-3]",
							className,
						)}
						role="alertdialog"
						aria-modal="true"
						aria-label={title}
					>
						<div className="px-5 py-4 text-center">
							<h2 className="ios-headline font-semibold text-[--system-text-primary] mb-1">
								{title}
							</h2>
							<p className="ios-footnote text-[--system-text-secondary] leading-relaxed">
								{message}
							</p>
						</div>
						<div className="ios-separator" />
						<div
							className={cn(
								"flex",
								actions.length > 1 ? "flex-row" : "flex-col",
							)}
						>
							{actions.map((action, index) => (
								<React.Fragment key={index}>
									{index > 0 && actions.length > 1 && (
										<div className="w-[0.33px] bg-[--system-separator] self-stretch" />
									)}
									<button
										type="button"
										onClick={() => {
											action.onClick();
											onOpenChange(false);
										}}
										className={cn(
											"flex-1 py-3.5 text-center ios-headline font-semibold transition-colors duration-150",
											action.variant === "destructive"
												? "text-[--system-destructive]"
												: action.variant === "cancel"
													? "text-[--system-text-secondary] font-normal"
													: "text-[--system-accent]",
											"hover:bg-[--system-surface-secondary] active:bg-[--system-surface-secondary]",
											actions.length > 1 ? "rounded-none" : "rounded-b-[22px]",
										)}
									>
										{action.label}
									</button>
								</React.Fragment>
							))}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

export { Alert };
