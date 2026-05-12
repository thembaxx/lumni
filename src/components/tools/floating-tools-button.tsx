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
	const isHomePage = pathname === "/";

	if (isHomePage) return null;

	return (
		<>
			<Button
				type="button"
				variant="default"
				onClick={() => setIsOpen(true)}
				className={cn(
					"fixed bottom-17.25 right-5 z-40",
					"size-13 rounded-full",
				)}
			>
				<Icon icon="fluent:board-24-regular" className="w-6 h-6" />
			</Button>

			<ToolsDialog open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
