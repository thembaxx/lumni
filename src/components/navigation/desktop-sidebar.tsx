"use client";

import {
	ChatDots,
	Gear,
	House,
	MonitorPlay,
	Notebook,
	User,
} from "@phosphor-icons/react";

import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChatDialog } from "@/components/dashboard/chat/chat-dialog";
import { Button } from "@/components/ui/button";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { cn } from "@/lib/utils";

interface SidebarItem {
	id: string;
	label: string;
	icon: typeof House;
	href: string;
}

const sidebarItems: SidebarItem[] = [
	{
		id: "home",
		label: "Home",
		icon: House,
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
		icon: ChatDots,
		href: "",
	},
	{
		id: "practice",
		label: "Practice",
		icon: MonitorPlay,
		href: "",
	},
];

const bottomItems: SidebarItem[] = [
	{
		id: "settings",
		label: "Settings",
		icon: User,
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
			} else if (item.id === "practice") {
				push("/dashboard");
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
				className="hidden md:flex flex-col w-64 h-[100dvh] bg-system-grouped border-r border-system-separator/50 pt-safe"
			>
				{/* App brand */}
				<div className="px-5 py-4">
					<h1 className="ios-headline text-system-accent">Lumni</h1>
				</div>

				{/* Primary navigation */}
				<nav aria-label="Primary" className="flex-1 px-3 flex flex-col gap-0.5">
					{sidebarItems.map((item) => {
						const isActive = item.id === activeId;
						return (
							<Button
								key={item.id}
								type="button"
								variant="ghost"
								onClick={() => handleClick(item)}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"flex items-center gap-3 w-full px-3 h-10 rounded-lg text-sm transition-all duration-150 text-left cursor-pointer",
									isActive
										? "bg-system-accent/10 text-system-accent font-semibold"
										: "text-system-text-secondary hover:text-system-text-primary hover:bg-system-fill",
								)}
							>
								{(() => {
									const Icon = item.icon;
									return (
										<Icon
											className={cn(
												"size-5 shrink-0",
												isActive
													? "text-system-accent"
													: "text-system-text-tertiary",
											)}
										/>
									);
								})()}
								<span>{item.label}</span>
							</Button>
						);
					})}
				</nav>

				{/* Bottom items */}
				<div className="px-3 pb-4 border-t border-system-separator/40 pt-2">
					{bottomItems.map((item) => {
						const isActive = item.id === activeId;
						return (
							<Button
								key={item.id}
								type="button"
								variant="ghost"
								onClick={() => handleClick(item)}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"flex items-center gap-3 w-full px-3 h-10 rounded-lg text-sm transition-all duration-150 text-left cursor-pointer",
									isActive
										? "bg-system-accent/10 text-system-accent font-semibold"
										: "text-system-text-secondary hover:text-system-text-primary hover:bg-system-fill",
								)}
							>
								{(() => {
									const Icon = item.icon;
									return (
										<Icon
											className={cn(
												"size-5 shrink-0",
												isActive
													? "text-system-accent"
													: "text-system-text-tertiary",
											)}
										/>
									);
								})()}
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
