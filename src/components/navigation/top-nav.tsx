"use client";

import {
	ChampionIcon,
	Login01Icon,
	Logout01Icon,
	Settings01Icon,
	UserGroupIcon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { SidebarHamburger } from "@/components/navigation/sidebar-nav";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownList,
	DropdownListContent,
	DropdownListItem,
	DropdownListSeparator,
	DropdownListTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamification } from "@/hooks/use-gamification";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { usePathname } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getRouteLabel } from "@/lib/navigation/config";
import { cn } from "@/lib/shared";
import { getRandomName } from "@/lib/utils/random-name";

interface TopNavProps {
	title?: string;
	className?: string;
}

export function TopNav({ title, className }: TopNavProps) {
	const pathname = usePathname();
	const _t = useTranslations();
	const { user, status, isAnonymous, signOut } = useAuth();
	const { levelInfo } = useGamification();
	const { isOnline, pendingCount } = useSyncStatus();

	const userLabels = user?.labels ?? [];
	const isTeacher = userLabels.includes("teacher");
	const isParent = userLabels.includes("parent");

	const handleSignOut = useCallback(async () => {
		await signOut();
	}, [signOut]);

	const diceBearSeed = useMemo(() => getRandomName(), []);

	const pageTitle = useMemo(() => {
		if (title) return title;

		const label = getRouteLabel(pathname);
		if (label) return label;

		const slug = pathname.split("/").filter(Boolean)[0];
		if (slug) return slug.charAt(0).toUpperCase() + slug.slice(1);
		return "Lumni";
	}, [pathname, title]);

	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		setMenuOpen(false);
		void pathname;
	}, [pathname]);

	const { isImmersive } = useImmersiveMode();
	const isAuthPage = pathname.startsWith("/auth");
	const isLanding = pathname === "/";
	const hasOwnHeader =
		pathname.startsWith("/settings") ||
		pathname.startsWith("/admin") ||
		pathname.startsWith("/dev");

	if (isAuthPage || isLanding || hasOwnHeader || isImmersive) return null;

	let imgSrc = null;
	if (
		(user?.prefs as Record<string, unknown>)?.avatarUrl &&
		typeof (user?.prefs as Record<string, unknown>)?.avatarUrl === "string"
	) {
		imgSrc = (user?.prefs as Record<string, unknown>).avatarUrl as string;
	} else {
		imgSrc = `https://api.dicebear.com/9.x/fun-emoji/svg?backgroundColor=ecad80,d1d4f9,b6e3f4,c0aede,ffdfbf&seed=${diceBearSeed}`;
	}

	return (
		<header
			className={cn(
				"sticky z-header border-system-separator/30 border-b bg-system-background/80 backdrop-blur-xl",
				"relative before:pointer-events-none before:absolute before:inset-0 before:bg-(--system-accent-alpha-10)",
				className,
			)}
			style={{ top: "env(titlebar-area-height, 0px)" }}
		>
			<div className="flex h-12 items-center justify-between px-4">
				<div className="flex items-center gap-4">
					<SidebarHamburger />
					<h1 className="ios-headline font-semibold text-foreground tracking-tight">
						{pageTitle}
					</h1>

					{status === "authenticated" &&
						!user?.labels?.includes("anonymous") && (
							<m.div
								initial={{ opacity: 0, x: -8 }}
								animate={{ opacity: 1, x: 0 }}
								className="flex items-center gap-2"
							>
								<div className="flex items-center gap-1.5 rounded-lg bg-(--system-accent-alpha-10) px-2 py-1">
									<HugeiconsIcon
										icon={ChampionIcon}
										className="size-3 text-(--system-accent)"
									/>
									<span className="ios-caption-2 font-bold text-(--system-accent) tabular-nums">
										Lv.{levelInfo.level}
									</span>
								</div>
								<div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
									<m.div
										initial={{ width: 0 }}
										animate={{ width: `${levelInfo.progress}%` }}
										transition={{ duration: 1, ease: "easeOut" }}
										className="h-full rounded-full bg-[--system-accent]"
									/>
								</div>
							</m.div>
						)}
				</div>

				<div className="flex items-center gap-2">
					<LocaleSwitcher />
					{!isOnline && (
						<div className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-warning">
							<Skeleton className="size-1.5 rounded-full" />
							<span className="ios-caption-3 font-medium">Offline</span>
						</div>
					)}
					{pendingCount > 0 && (
						<div className="flex items-center gap-1 rounded-full bg-(--system-accent-alpha-10) px-2 py-0.5 text-(--system-accent)">
							<div className="size-1.5 rounded-full bg-[--system-accent]" />
							<span className="ios-caption-3 font-medium">{pendingCount}</span>
						</div>
					)}
					{status === "loading" ? (
						<Skeleton className="size-8 rounded-full" />
					) : (
						<>
							{(status === "unauthenticated" || isAnonymous) && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										const redirect = encodeURIComponent(pathname);
										window.location.href = `/auth/sign-in?redirect=${redirect}`;
									}}
									className="h-8 rounded-full px-3 font-semibold text-sm text-system-accent hover:bg-system-accent/10"
								>
									<HugeiconsIcon icon={Login01Icon} className="mr-1.5 size-4" />
									Sign In
								</Button>
							)}
							{status === "authenticated" && (
								<DropdownList open={menuOpen} onOpenChange={setMenuOpen}>
									<DropdownListTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-[--system-accent] focus-visible:ring-offset-2">
										<Avatar className="size-8 cursor-pointer ring-2 ring-transparent transition-shadow hover:ring-system-accent/30">
											<AvatarImage src={imgSrc} alt={user?.name || "User"} />
											<AvatarFallback className="bg-system-accent font-bold text-white text-xs">
												{user?.name?.charAt(0)?.toUpperCase() || "U"}
											</AvatarFallback>
										</Avatar>
									</DropdownListTrigger>
									<DropdownListContent
										align="end"
										sideOffset={8}
										className="w-56"
									>
										<div className="border-border/30 border-b px-3 py-2.5">
											<div className="font-semibold text-foreground text-sm">
												{user?.name || "Anonymous"}
											</div>
											<div className="mt-0.5 text-muted-foreground text-xs">
												{user?.email || "Email not available"}
											</div>
										</div>
										<div className="p-1">
											<DropdownListItem
												className="rounded-md"
												onClick={() => {
													window.location.href = "/settings?tab=profile";
												}}
											>
												<HugeiconsIcon icon={UserIcon} className="size-4" />
												View Profile
											</DropdownListItem>
											{isTeacher && (
												<DropdownListItem
													className="rounded-md"
													onClick={() => {
														window.location.href = "/teacher";
													}}
												>
													<HugeiconsIcon
														icon={UserGroupIcon}
														className="size-4"
													/>
													Teacher Dashboard
												</DropdownListItem>
											)}
											{isParent && (
												<DropdownListItem
													className="rounded-md"
													onClick={() => {
														window.location.href = "/parent";
													}}
												>
													<HugeiconsIcon icon={UserIcon} className="size-4" />
													Parent Dashboard
												</DropdownListItem>
											)}
											<DropdownListItem
												className="rounded-md"
												onClick={() => {
													window.location.href = "/settings";
												}}
											>
												<HugeiconsIcon
													icon={Settings01Icon}
													className="size-4"
												/>
												Settings
											</DropdownListItem>
										</div>
										<DropdownListSeparator />
										<div className="p-1">
											<DropdownListItem
												variant="destructive"
												onClick={handleSignOut}
											>
												<HugeiconsIcon icon={Logout01Icon} className="size-4" />
												Sign Out
											</DropdownListItem>
										</div>
									</DropdownListContent>
								</DropdownList>
							)}
						</>
					)}
				</div>
			</div>
		</header>
	);
}
