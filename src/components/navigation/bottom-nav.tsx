"use client";

import {
	ChatDots,
	House,
	MonitorPlay,
	Notebook,
	User,
} from "@phosphor-icons/react";

import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChatDialog } from "@/components/dashboard/chat/chat-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { cn } from "@/lib/utils";

interface NavItem {
	id: string;
	label: string;
	icon: typeof House;
	href: string;
	badge?: number;
}

const navItems: NavItem[] = [
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
	{
		id: "settings",
		label: "Settings",
		icon: User,
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
			type="button"
			variant="ghost"
			onClick={onClick}
			aria-current={isActive ? "page" : undefined}
			className="[all:unset] flex flex-1 flex-col items-center justify-center gap-0.5 h-full min-w-0 transition-colors duration-150 relative cursor-pointer active:opacity-60"
		>
			<div className="relative flex items-center justify-center size-6">
				{(() => {
					const Icon = item.icon;
					return (
						<Icon
							className={cn(
								"size-[25px] transition-colors duration-200",
								isActive ? "text-system-accent" : "text-system-text-tertiary",
							)}
						/>
					);
				})()}
				{item.badge !== undefined && item.badge > 0 && (
					<Badge
						variant="destructive"
						className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 text-[10px] leading-none border-0"
					>
						{item.badge > 99 ? "99+" : item.badge}
					</Badge>
				)}
			</div>
			<span
				className={cn(
					"text-[10px] font-medium leading-none tracking-[var(--tracking-caption-1)] uppercase transition-colors duration-200",
					isActive ? "text-system-accent" : "text-system-text-tertiary",
				)}
			>
				{item.label}
			</span>
		</Button>
	);
}

export function BottomNav() {
	const pathname = usePathname();
	const { push } = useNavigationDirection();
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
				push("/dashboard");
			} else {
				push(item.href);
			}
		},
		[push],
	);

	if (pathname === "/") return null;

	return (
		<>
			<nav
				aria-label="Main navigation"
				className="fixed bottom-0 left-0 right-0 z-50 md:hidden w-full flex"
				style={{ height: "calc(49px + env(safe-area-inset-bottom, 0px))" }}
			>
				<div className="flex w-full h-12.25 grow items-stretch bg-system-background/80 backdrop-blur-xl border-t border-system-separator/30">
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
			<ChatDialog open={chatDialogOpen} onOpenChange={setChatDialogOpen} />
		</>
	);
}
