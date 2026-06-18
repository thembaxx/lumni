"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { iOSDecelerate } from "@/lib/utils/animation";

interface ChallengeDialogProps {
	open: boolean;
	onClose: () => void;
	layoutId: string;
	children: React.ReactNode;
	className?: string;
}

export function ChallengeDialog({
	open,
	onClose,
	layoutId,
	children,
	className,
}: ChallengeDialogProps) {
	const shouldReduceMotion = useReducedMotion();
	const contentRef = useRef<HTMLDivElement>(null);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		},
		[onClose],
	);

	const handleKeyDownRef = useRef(handleKeyDown);
	handleKeyDownRef.current = handleKeyDown;

	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => handleKeyDownRef.current(e);
		document.addEventListener("keydown", handler);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handler);
			document.body.style.overflow = "";
		};
	}, [open]);

	useEffect(() => {
		if (open && contentRef.current) {
			contentRef.current.focus();
		}
	}, [open]);

	if (typeof window === "undefined") return null;

	return createPortal(
		<>
			<AnimatePresence>
				{open && (
					<m.div
						key="challenge-dialog-backdrop"
						initial={shouldReduceMotion ? false : { opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2, ease: iOSDecelerate }}
						className="fixed inset-0 z-modal bg-black/80 backdrop-blur-xs"
						onClick={onClose}
						aria-hidden="true"
					/>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{open && (
					<m.div
						key="challenge-dialog-content"
						ref={contentRef}
						layoutId={layoutId}
						tabIndex={-1}
						role="dialog"
						aria-modal="true"
						className={
							className ??
							"fixed top-1/2 left-1/2 z-modal w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-popover p-0 shadow-level-3 outline-none ring-1 ring-foreground/10"
						}
						onClick={(e) => e.stopPropagation()}
					>
						{children}
					</m.div>
				)}
			</AnimatePresence>
		</>,
		document.body,
	);
}
