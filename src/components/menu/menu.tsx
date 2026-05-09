"use client";

import { Menu09Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThemeSwitcher } from "@/components/theme";
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
			<DrawerTrigger asChild>
				<button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors duration-200 btn-ghost-hover focus-ring focus-visible:outline-none">
					<HugeiconsIcon
						icon={Menu09Icon}
						className="w-4 h-4 transition-transform duration-200"
					/>
				</button>
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
