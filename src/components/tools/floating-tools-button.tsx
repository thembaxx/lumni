"use client";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ToolsDialog } from "./tools-dialog";

export function FloatingToolsButton() {
	const [isOpen, setIsOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const pathname = usePathname();
	const isHomePage = pathname === "/";

	if (isHomePage) return null;

	return (
		<>
			<motion.button
				onClick={() => setIsOpen(true)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className={cn(
					"fixed bottom-21.5 right-5 z-40",
					"w-14 h-14 rounded-[999px]",
					"bg-[#ffffff] text-[#000000]",
					"shadow-[rgba(0,0,0,0.16)_0px_2px_8px_0px]",
					"translate-y-[2px]",
					"flex items-center justify-center",
					"active:scale-[0.97] transition-all duration-150 ease-out",
					"dark:bg-[#1a1a1a] dark:text-[#ffffff] dark:shadow-[rgba(255,255,255,0.1)_0px_2px_8px_0px]",
					"hover:bg-[#f3f3f3] dark:hover:bg-[#2a2a2a]",
				)}
				initial={{ scale: 0, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
				whileHover={{ scale: 1.05 }}
			>
				<AnimatePresence mode="wait" initial={false}>
					{isHovered ? (
						<motion.div
							key="tools-hover"
							initial={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
							animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
							exit={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
							transition={{ type: "spring", duration: 0.3, bounce: 0 }}
						>
							<Icon icon="fluent:chess-24-filled" className="w-6 h-6" />
						</motion.div>
					) : (
						<motion.div
							key="tools-normal"
							initial={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
							animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
							exit={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
							transition={{ type: "spring", duration: 0.3, bounce: 0 }}
						>
							<Icon icon="fluent:chess-24-filled" className="w-6 h-6" />
						</motion.div>
					)}
				</AnimatePresence>
			</motion.button>

			<ToolsDialog open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
