"use client";

import {
	BubbleChatSpark01Icon,
	Home01Icon,
	Notebook01Icon,
	OnlineLearning01Icon,
	User03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChatDialog } from "@/components/dashboard/chat/chat-dialog";
import { PracticeSheet } from "@/components/dashboard/practice/practice-sheet";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { cn } from "@/lib/utils";

interface NavItem {
	id: string;
	label: string;
	icon: typeof Home01Icon;
	href: string;
	badge?: number;
}

const navItems: NavItem[] = [
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
	{
		id: "settings",
		label: "Settings",
		icon: User03Icon,
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
		<button
			type="button"
			onClick={onClick}
			aria-current={isActive ? "page" : undefined}
			className={cn(
				"flex flex-1 flex-col items-center justify-center gap-0.5 h-full min-w-0",
				"transition-colors duration-150 relative cursor-pointer",
				"bg-transparent border-none outline-none",
				"active:opacity-60",
			)}
		>
			<div className="relative flex items-center justify-center size-6">
				<HugeiconsIcon
					icon={item.icon}
					aria-hidden="true"
					className={cn(
						"size-[25px] transition-colors duration-200",
						isActive ? "text-system-accent" : "text-system-text-tertiary",
					)}
				/>
				{item.badge !== undefined && item.badge > 0 && (
					<span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-system-destructive text-[10px] font-semibold text-white flex items-center justify-center leading-none">
						{item.badge > 99 ? "99+" : item.badge}
					</span>
				)}
			</div>
			<span
				className={cn(
					"text-[10px] font-medium leading-none tracking-[var(--tracking-caption-1)] transition-colors duration-200",
					isActive ? "text-system-accent" : "text-system-text-tertiary",
				)}
			>
				{item.label}
			</span>
		</button>
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
			<nav
				aria-label="Main navigation"
				className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
				style={{ height: "calc(49px + env(safe-area-inset-bottom, 0px))" }}
			>
				<div className="flex w-full h-[49px] items-stretch bg-system-background/80 backdrop-blur-xl border-t border-system-separator/30">
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
