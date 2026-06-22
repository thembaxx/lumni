"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useAuth } from "@/lib/auth/auth-context";
import { iOSEase } from "@/lib/utils/animation";

const DISMISS_PREFIX = "lumni_local_notice_dismissed";

interface LocalDataNoticeProps {
	page: string;
	icon?: typeof DatabaseIcon;
	title?: string;
	description: string;
}

export function LocalDataNotice({
	page,
	icon: Icon = DatabaseIcon,
	title = "Saved on this device",
	description,
}: LocalDataNoticeProps) {
	const { isAnonymous } = useAuth();
	const { push } = useNavigationDirection();
	const storageKey = `${DISMISS_PREFIX}_${page}`;
	const [localDismissed, setLocalDismissed] = useState(() => {
		if (typeof window === "undefined") return true;
		return localStorage.getItem(storageKey) === "true";
	});

	const dismissed = localDismissed || !isAnonymous;

	const handleDismiss = useCallback(() => {
		localStorage.setItem(storageKey, "true");
		setLocalDismissed(true);
	}, [storageKey]);

	if (dismissed) return null;

	return (
		<m.div
			initial={{ opacity: 0, y: -6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: iOSEase }}
			className="flex items-center gap-3 rounded-xl border border-system-accent/15 bg-system-accent/8 px-4 py-3"
		>
			<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-accent/15">
				<HugeiconsIcon icon={Icon} className="size-4 text-system-accent" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-balance font-semibold text-sm">{title}</p>
				<p className="text-muted-foreground text-xs">{description}</p>
			</div>
			<div className="flex shrink-0 items-center gap-1">
				<Button
					size="sm"
					variant="default"
					className="h-8 px-3 text-xs"
					onClick={() => {
						const currentPath = window.location.pathname;
						push(`/auth/sign-up?redirect=${currentPath}`);
					}}
				>
					Sign Up
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleDismiss}
					className="-mr-1.5"
					aria-label="Dismiss"
				>
					<HugeiconsIcon
						icon={Cancel01Icon}
						className="size-4 text-muted-foreground"
					/>
				</Button>
			</div>
		</m.div>
	);
}
