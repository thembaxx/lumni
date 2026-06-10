"use client";

import { Cancel01Icon, GraduationCapIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
	dismissAction,
	type NextAction,
	resolveNextAction,
} from "@/lib/retention-loop/next-action";

export function NextBestActionCard() {
	const { user } = useAuth();
	const [action, setAction] = useState<NextAction | null>(null);
	const [dismissed, setDismissed] = useState(false);

	const refresh = useCallback(async () => {
		const a = await resolveNextAction(user?.$id);
		setAction(a);
		setDismissed(false);
	}, [user?.$id]);

	const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);
	useEffect(() => {
		refresh();
		if (!refreshIntervalRef.current) {
			refreshIntervalRef.current = setInterval(refresh, 60000);
		}
		const onVisibility = () => {
			if (document.visibilityState === "visible") refresh();
		};
		const onFocus = () => refresh();
		document.addEventListener("visibilitychange", onVisibility);
		window.addEventListener("focus", onFocus);
		return () => {
			if (refreshIntervalRef.current) {
				clearInterval(refreshIntervalRef.current);
				refreshIntervalRef.current = null;
			}
			document.removeEventListener("visibilitychange", onVisibility);
			window.removeEventListener("focus", onFocus);
		};
	}, [refresh]);

	if (!action || dismissed) return null;

	return (
		<Card className="relative border border-system-accent/20 bg-system-accent/[0.04]">
			<button
				type="button"
				onClick={() => {
					dismissAction(action.kind);
					setDismissed(true);
				}}
				className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full text-muted-foreground/50 hover:bg-muted/50 hover:text-foreground"
				aria-label="Dismiss suggestion"
			>
				<HugeiconsIcon icon={Cancel01Icon} size={14} />
			</button>
			<CardHeader className="flex-row items-center gap-2">
				<div className="flex size-8 items-center justify-center rounded-lg bg-system-accent/10">
					<HugeiconsIcon
						icon={GraduationCapIcon}
						size={16}
						className="text-system-accent"
					/>
				</div>
				<CardTitle className="font-semibold text-sm">{action.title}</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-2 pr-6">
				<p className="text-muted-foreground text-xs leading-relaxed">
					{action.reason}
				</p>
				<Link
					href={action.ctaHref}
					className="mt-0.5 inline-flex h-9 w-fit items-center rounded-lg bg-system-accent px-4 font-medium text-white text-xs transition-[background-color,transform] hover:bg-system-accent/85 active:scale-[0.97]"
				>
					{action.ctaLabel}
				</Link>
			</CardContent>
		</Card>
	);
}
