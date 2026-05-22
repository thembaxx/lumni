"use client";

import { Cancel01Icon, DatabaseIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
	const [dismissed, setDismissed] = useState(true);

	const storageKey = `${DISMISS_PREFIX}_${page}`;

	useEffect(() => {
		const raw = localStorage.getItem(storageKey);
		setDismissed(raw === "true" || !isAnonymous);
	}, [isAnonymous, storageKey]);

	const handleDismiss = useCallback(() => {
		localStorage.setItem(storageKey, "true");
		setDismissed(true);
	}, [storageKey]);

	if (dismissed || !isAnonymous) return null;

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
						window.location.href = `/auth/sign-up?redirect=${window.location.pathname}`;
					}}
				>
					Sign Up
				</Button>
				<button
					type="button"
					onClick={handleDismiss}
					className="-mr-1.5 rounded-md p-2 transition-colors hover:bg-muted/50"
					aria-label="Dismiss"
				>
					<HugeiconsIcon
						icon={Cancel01Icon}
						className="size-4 text-muted-foreground"
					/>
				</button>
			</div>
		</m.div>
	);
}
