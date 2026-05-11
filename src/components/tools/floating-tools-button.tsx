"use client";

import { Icon } from "@iconify/react";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ToolsDialog } from "./tools-dialog";

export function FloatingToolsButton() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();
	const isHomePage = pathname === "/";

	if (isHomePage) return null;

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className={cn(
					"fixed bottom-[69px] right-5 z-40",
					"size-[52px] rounded-[16px]",
					"bg-[--system-surface] text-[--system-accent]",
					"shadow-[--shadow-level-3]",
					"flex items-center justify-center",
					"hover:bg-[--system-surface-secondary] active:bg-[--system-surface-secondary]",
					"transition-colors duration-150",
					"dark:bg-[--system-surface] dark:text-[--system-accent]",
				)}
			>
				<Icon icon="fluent:chess-24-filled" className="w-6 h-6" />
			</button>

			<ToolsDialog open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
