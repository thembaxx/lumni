"use client";

import {
	Home01Icon,
	Notebook01Icon,
	BubbleChatSpark01Icon,
	OnlineLearning01Icon,
	User03Icon,
	Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChatDialog } from "@/components/dashboard/chat/chat-dialog";
import { PracticeSheet } from "@/components/dashboard/practice/practice-sheet";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { cn } from "@/lib/utils";

interface SidebarItem {
	id: string;
	label: string;
	icon: typeof Home01Icon;
	href: string;
}

const sidebarItems: SidebarItem[] = [
	{
		id: "home",
		label: "Home",
		icon: Home01Icon,
		href: "/dashboard",
	},
	{
		id: "syllabus",
		label: "Syllabus",
		icon: Notebook01Icon,
		href: "/quiz",
	},
	{
		id: "chat",
		label: "Chat",
		icon: BubbleChatSpark01Icon,
		href: "",
	},
	{
		id: "practice",
		label: "Practice",
		icon: OnlineLearning01Icon,
		href: "",
	},
];

const bottomItems: SidebarItem[] = [
	{
		id: "settings",
		label: "Settings",
		icon: User03Icon,
		href: "/settings",
	},
];

export function DesktopSidebar() {
	const pathname = usePathname();
	const { push } = useNavigationDirection();
	const [practiceOpen, setPracticeOpen] = useState(false);
	const [chatOpen, setChatOpen] = useState(false);

	const activeId = useMemo(() => {
		const item = sidebarItems.find((item) => {
			if (item.href === "/dashboard") {
				return pathname === "/dashboard" || pathname === "/";
			}
			return item.href && pathname.startsWith(item.href);
		});
		return item?.id;
	}, [pathname]);

	const handleClick = useCallback(
		(item: SidebarItem) => {
			if (item.id === "chat") {
				setChatOpen(true);
			} else if (item.id === "practice") {
				setPracticeOpen(true);
			} else {
				push(item.href);
			}
		},
		[push],
	);

	return (
		<>
			<aside aria-label="Sidebar navigation" className="hidden md:flex flex-col w-64 h-screen bg-system-grouped border-r border-system-separator/50 pt-safe">
				{/* App brand */}
				<div className="px-5 py-4">
					<h1 className="ios-headline text-system-accent">Lumni</h1>
				</div>

				{/* Primary navigation */}
				<nav aria-label="Primary" className="flex-1 px-3 space-y-0.5">
					{sidebarItems.map((item) => {
						const isActive = item.id === activeId;
						return (
							<button
								key={item.id}
								type="button"
								onClick={() => handleClick(item)}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"flex items-center gap-3 w-full px-3 h-10 rounded-lg text-sm transition-all duration-150",
									"text-left cursor-pointer border-none",
									isActive
										? "bg-system-accent/10 text-system-accent font-semibold"
										: "text-system-text-secondary hover:text-system-text-primary hover:bg-system-fill",
								)}
							>
								<HugeiconsIcon
									icon={item.icon}
									aria-hidden="true"
									className={cn(
										"size-5 shrink-0",
										isActive
											? "text-system-accent"
											: "text-system-text-tertiary",
									)}
								/>
								<span>{item.label}</span>
							</button>
						);
					})}
				</nav>

				{/* Bottom items */}
				<div className="px-3 pb-4 border-t border-system-separator/40 pt-2">
					{bottomItems.map((item) => {
						const isActive = item.id === activeId;
						return (
							<button
								key={item.id}
								type="button"
								onClick={() => handleClick(item)}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"flex items-center gap-3 w-full px-3 h-10 rounded-lg text-sm transition-all duration-150",
									"text-left cursor-pointer border-none",
									isActive
										? "bg-system-accent/10 text-system-accent font-semibold"
										: "text-system-text-secondary hover:text-system-text-primary hover:bg-system-fill",
								)}
							>
								<HugeiconsIcon
									icon={item.icon}
									aria-hidden="true"
									className={cn(
										"size-5 shrink-0",
										isActive
											? "text-system-accent"
											: "text-system-text-tertiary",
									)}
								/>
								<span>{item.label}</span>
							</button>
						);
					})}
				</div>
			</aside>
			<PracticeSheet open={practiceOpen} onOpenChange={setPracticeOpen} />
			<ChatDialog open={chatOpen} onOpenChange={setChatOpen} />
		</>
	);
}
