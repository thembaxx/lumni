"use client";

import { GridIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/use-onboarding";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/shared";
import { useToolsStore } from "@/store/tools";
import { ToolsDialog } from "./tools-dialog";

export function FloatingToolsButton() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();
	const { isOnboarding } = useOnboarding();
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

	const isHomePage = pathname === "/";

	const handleOpen = () => {
		openTools();
		setIsOpen(true);
	};

	if (isHomePage || isOnboarding) return null;

	return (
		<>
			<Button
				type="button"
				variant="default"
				onClick={handleOpen}
				className={cn(
					"fixed right-5 bottom-17.25 z-toast",
					"h-11 rounded-lg pr-5 font-medium text-white/90 shadow-level-3",
				)}
			>
				<HugeiconsIcon icon={GridIcon} className="text-white" />
				Open Tools
			</Button>

			<ToolsDialog open={isOpen} onOpenChange={handleOpenChange} />
		</>
	);
}
