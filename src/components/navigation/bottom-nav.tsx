"use client";

import { Icon } from "@iconify/react";

import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChatDialog } from "@/components/dashboard/chat/chat-dialog";
import { PracticeSheet } from "@/components/dashboard/practice/practice-sheet";
import { Button } from "@/components/ui/button";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { cn } from "@/lib/utils";

interface NavItem {
	id: string;
	label: string;
	icon: string;
	href: string;
}

const navItems: NavItem[] = [
	{
		id: "home",
		label: "Home",
		icon: "fluent:home-24-filled",
		href: "/dashboard",
	},
	{
		id: "syllabus",
		label: "Syllabus",
		icon: "fluent:notebook-24-filled",
		href: "/quiz",
	},
	{
		id: "chat",
		label: "Chat",
		icon: "fluent:chat-sparkle-24-filled",
		href: "",
	},
	{
		id: "practice",
		label: "Practice",
		icon: "fluent:learning-app-24-filled",
		href: "",
	},
	{
		id: "settings",
		label: "Settings",
		icon: "fluent:person-24-filled",
		href: "/settings",
	},
];

function NavItemComponent({
	item,
	isActive,
	onClick,
}: {
	item: NavItem;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			variant="ghost"
			onClick={onClick}
			className={cn(
				"flex flex-1 flex-col items-center justify-center gap-1 px-2 h-auto rounded-none min-h-0 py-0",
				isActive
					? "text-[--system-accent]"
					: "text-[--system-text-tertiary] hover:text-[--system-text-secondary]",
			)}
		>
			<Icon icon={item.icon} className="w-[25px] h-[25px]" />
			<span className="text-[10px] font-medium tracking-wide">
				{item.label}
			</span>
		</Button>
	);
}

export function BottomNav() {
	const pathname = usePathname();
	const { push } = useNavigationDirection();
	const [practiceDrawerOpen, setPracticeDrawerOpen] = useState(false);
	const [chatDialogOpen, setChatDialogOpen] = useState(false);

	const activeIndex = useMemo(() => {
		const index = navItems.findIndex((item) => {
			if (item.href === "/dashboard") {
				return pathname === "/dashboard" || pathname === "/";
			}
			return pathname.startsWith(item.href);
		});
		return index >= 0 ? index : 0;
	}, [pathname]);

	const handleItemClick = useCallback(
		(item: NavItem) => {
			if (item.id === "chat") {
				setChatDialogOpen(true);
			} else if (item.id === "practice") {
				setPracticeDrawerOpen(true);
			} else {
				push(item.href);
			}
		},
		[push],
	);

	if (pathname === "/") return null;

	return (
		<>
			<nav className="fixed bottom-0 left-0 right-0 z-50 h-[49px] bg-[--system-surface] ios-separator md:hidden pb-safe">
				<div className="flex w-full h-full items-center px-1.5">
					{navItems.map((item, index) => (
						<NavItemComponent
							key={item.id}
							item={item}
							isActive={index === activeIndex}
							onClick={() => handleItemClick(item)}
						/>
					))}
				</div>
			</nav>
			<PracticeSheet
				open={practiceDrawerOpen}
				onOpenChange={setPracticeDrawerOpen}
			/>
			<ChatDialog open={chatDialogOpen} onOpenChange={setChatDialogOpen} />
		</>
	);
}
