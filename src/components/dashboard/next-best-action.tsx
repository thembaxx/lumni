"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
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

	useEffect(() => {
		refresh();
		const interval = setInterval(refresh, 60000);
		return () => clearInterval(interval);
	}, [refresh]);

	if (!action || dismissed) return null;

	return (
		<Card className="relative overflow-hidden border-l-4 border-l-[oklch(52%_0.18_146)] bg-gradient-to-r from-[oklch(52%_0.18_146_/_0.06)] to-transparent">
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
			<CardHeader>
				<CardTitle className="font-semibold text-sm">{action.title}</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-1.5 pr-6">
				<p className="text-muted-foreground text-xs leading-relaxed">
					{action.reason}
				</p>
				<Link
					href={action.ctaHref}
					className="mt-1 inline-flex h-9 w-fit items-center rounded-lg bg-[oklch(52%_0.18_146)] px-4 font-medium text-white text-xs transition-[background-color] hover:bg-[oklch(45%_0.18_146)] active:scale-[0.97]"
				>
					{action.ctaLabel}
				</Link>
			</CardContent>
		</Card>
	);
}
