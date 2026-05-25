"use client";

import {
	BookOpen01Icon,
	Chat01Icon,
	Home01Icon,
	Notebook,
	Settings01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChatDialog } from "@/components/dashboard/chat/chat-dialog";
import { Button } from "@/components/ui/button";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { cn } from "@/lib/shared";

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
		icon: Notebook,
		href: "/quiz",
	},
	{
		id: "chat",
		label: "Chat",
		icon: Chat01Icon,
		href: "/chat",
	},
	{
		id: "problems",
		label: "Problems",
		icon: BookOpen01Icon,
		href: "/problems",
	},
	{
		id: "groups",
		label: "Study Groups",
		icon: UserGroupIcon,
		href: "/study-groups",
	},
];

const bottomItems: SidebarItem[] = [
	{
		id: "settings",
		label: "Settings",
		icon: Settings01Icon,
		href: "/settings",
	},
];

export function DesktopSidebar() {
	const pathname = usePathname();
	const { push } = useNavigationDirection();
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
			} else {
				push(item.href);
			}
		},
		[push],
	);

	return (
		<>
			<aside
				aria-label="Sidebar navigation"
				className="hidden h-[100dvh] w-64 flex-col border-system-separator/50 border-r bg-system-grouped pt-safe md:flex"
			>
				{/* App brand */}
				<div className="px-5 py-4">
					<h1 className="ios-headline text-system-accent">Lumni</h1>
				</div>

				{/* Primary navigation */}
				<nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 px-3">
					{sidebarItems.map((item) => {
						const Icon = item.icon;
						const isActive = item.id === activeId;
						return (
							<Button
								key={item.id}
								type="button"
								variant="ghost"
								onClick={() => handleClick(item)}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors duration-150",
									isActive
										? "bg-system-accent/10 font-semibold text-system-accent"
										: "text-system-text-secondary hover:bg-system-fill hover:text-system-text-primary",
								)}
							>
								<HugeiconsIcon
									icon={Icon}
									className={cn(
										"size-5 shrink-0",
										isActive
											? "text-system-accent"
											: "text-system-text-tertiary",
									)}
								/>
								<span>{item.label}</span>
							</Button>
						);
					})}
				</nav>

				{/* Bottom items */}
				<div className="border-system-separator/40 border-t px-3 pt-2 pb-5">
					{bottomItems.map((item) => {
						const Icon = item.icon;
						const isActive = item.id === activeId;
						return (
							<Button
								key={item.id}
								type="button"
								variant="ghost"
								onClick={() => handleClick(item)}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors duration-150",
									isActive
										? "bg-system-accent/10 font-semibold text-system-accent"
										: "text-system-text-secondary hover:bg-system-fill hover:text-system-text-primary",
								)}
							>
								<HugeiconsIcon
									icon={Icon}
									className={cn(
										"size-5 shrink-0",
										isActive
											? "text-system-accent"
											: "text-system-text-tertiary",
									)}
								/>
								<span>{item.label}</span>
							</Button>
						);
					})}
				</div>
			</aside>
			<ChatDialog open={chatOpen} onOpenChange={setChatOpen} />
		</>
	);
}
