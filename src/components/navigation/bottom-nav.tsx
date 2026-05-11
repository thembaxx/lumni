"use client";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChatDialog } from "@/components/dashboard/chat/chat-dialog";
import { PracticeSheet } from "@/components/dashboard/practice/practice-sheet";
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
		icon: "fluent:home-empty-24-filled",
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
		icon: "fluent:book-open-24-filled",
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
		<motion.button
			onClick={onClick}
			className={cn(
				"flex flex-1 flex-col items-center justify-center gap-1.5 py-3 px-2 min-h-14 rounded-[999px] transition-all duration-200 relative",
				isActive
					? "bg-[#000000] text-[#ffffff] dark:bg-[#ffffff] dark:text-[#000000]"
					: "bg-[#efefef] text-[#000000] hover:bg-[#e2e2e2] dark:bg-[#2a2a2a] dark:text-[#ffffff] dark:hover:bg-[#3a3a3a]",
			)}
			whileTap={{ scale: 0.95 }}
			transition={{ duration: 0.15 }}
		>
			<div className="relative z-10">
				<Icon
					icon={item.icon}
					className={cn(
						"w-5 h-5 transition-transform duration-200",
						isActive && "scale-110",
					)}
				/>
			</div>
			<span
				className={cn(
					"text-[10px] font-medium tracking-wide transition-colors duration-200",
				)}
			>
				{item.label}
			</span>
		</motion.button>
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
			<motion.nav
				className="fixed bottom-0 left-0 right-0 z-50 bg-[#ffffff] dark:bg-[#1a1a1a] border-t border-[#000000]/10 dark:border-[#ffffff]/10 md:hidden"
				initial={{ y: 100, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
			>
				<div className="flex w-full px-3 pb-safe gap-1">
					{navItems.map((item, index) => (
						<NavItemComponent
							key={item.id}
							item={item}
							isActive={index === activeIndex}
							onClick={() => handleItemClick(item)}
						/>
					))}
				</div>
			</motion.nav>
			<PracticeSheet
				open={practiceDrawerOpen}
				onOpenChange={setPracticeDrawerOpen}
			/>
			<ChatDialog open={chatDialogOpen} onOpenChange={setChatDialogOpen} />
		</>
	);
}
