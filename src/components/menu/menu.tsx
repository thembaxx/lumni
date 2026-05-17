"use client";

import { ListViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThemeSwitcher } from "@/components/theme";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";

interface MenuProps {
	children?: React.ReactNode;
}

export function Menu({ children }: MenuProps) {
	return (
		<Drawer direction="bottom">
			<DrawerTrigger
				className="inline-flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 size-10 transition-colors"
				aria-label="Open menu"
			>
				<HugeiconsIcon icon={ListViewIcon} className="w-4 h-4" />
			</DrawerTrigger>
			<DrawerContent className="mx-auto max-w-lg mt-0 rounded-b-2xl min-h-[40dvh] animate-fade-in-scale">
				<DrawerHeader className="text-left">
					<DrawerTitle className="text-left">Menu</DrawerTitle>
					<DrawerDescription className="text-left">
						Quick access to your settings and features.
					</DrawerDescription>
				</DrawerHeader>
				<div className="px-4 pb-4 pt-0 grow">{children}</div>
				<div className="border-t border-border px-4 py-3">
					<ThemeSwitcher />
				</div>
			</DrawerContent>
		</Drawer>
	);
}
