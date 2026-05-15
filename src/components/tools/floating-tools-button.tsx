"use client";

import { Icon } from "@iconify/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";
import { useToolsStore } from "@/store/tools";
import { ToolsDialog } from "./tools-dialog";

export function FloatingToolsButton() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();
	const isHousePage = pathname === "/";
	const storeOpen = useToolsStore((s) => s.open);
	const closeTools = useToolsStore((s) => s.closeTools);
	const openTools = useToolsStore((s) => s.openTools);

	useEffect(() => {
		if (storeOpen) {
			setIsOpen(true);
		}
	}, [storeOpen]);

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			closeTools();
		}
	};

	const handleOpen = () => {
		openTools();
		setIsOpen(true);
	};

	if (isHousePage) return null;

	return (
		<>
			<Button
				type="button"
				variant="default"
				onClick={handleOpen}
				className={cn(
					"fixed bottom-17.25 right-5 z-40",
					"h-11 rounded-lg shadow-level-3 font-medium pr-5 text-white/90",
				)}
			>
				<Icon icon="fluent:board-24-regular" data-icon className="text-white" />
				Open Tools
			</Button>

			<ToolsDialog open={isOpen} onOpenChange={handleOpenChange} />
		</>
	);
}
