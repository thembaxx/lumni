"use client";

import { Icon } from "@iconify/react";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToolsDialog } from "./tools-dialog";

export function FloatingToolsButton() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();
	const isHousePage = pathname === "/";

	if (isHousePage) return null;

	return (
		<>
			<Button
				type="button"
				variant="default"
				onClick={() => setIsOpen(true)}
				className={cn(
					"fixed bottom-17.25 right-5 z-40",
					"h-11 rounded-md shadow-level-3 font-medium pr-5 text-white",
				)}
			>
				<Icon icon="fluent:board-24-regular" data-icon className="text-white" />
				Open Tools
			</Button>

			<ToolsDialog open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
