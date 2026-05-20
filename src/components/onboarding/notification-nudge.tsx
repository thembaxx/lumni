"use client";

import { BellElectricIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/use-onboarding";
import { iOSEase } from "@/lib/utils/animation";

const NUDGE_DISMISSED_KEY = "lumni_notification_nudge_dismissed";

export function NotificationNudge() {
	const { push } = useRouter();
	const { data } = useOnboarding();
	const [dismissed, setDismissed] = useState(true);

	useEffect(() => {
		const dismissedRaw = localStorage.getItem(NUDGE_DISMISSED_KEY);
		const isDismissed =
			dismissedRaw === "true" ||
			!(data.isComplete && !data.notificationsEnabled);
		setDismissed(isDismissed);
	}, [data.isComplete, data.notificationsEnabled]);

	if (dismissed) return null;

	const handleDismiss = () => {
		localStorage.setItem(NUDGE_DISMISSED_KEY, "true");
		setDismissed(true);
	};

	const handleEnable = () => {
		push("/settings");
		handleDismiss();
	};

	return (
		<m.div
			initial={{ opacity: 0, y: -6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: iOSEase }}
			className="flex items-center gap-3 rounded-xl border border-system-accent/15 bg-system-accent/8 px-4 py-3"
		>
			<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-accent/15">
				<HugeiconsIcon
					icon={BellElectricIcon}
					className="size-4 text-system-accent"
				/>
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-balance font-semibold text-sm">
					Enable study reminders
				</p>
				<p className="text-muted-foreground text-xs">
					Get daily nudges to keep your streak alive.
				</p>
			</div>
			<div className="flex shrink-0 items-center gap-1">
				<Button
					size="sm"
					variant="default"
					className="h-8 px-3 text-xs"
					onClick={handleEnable}
				>
					Enable
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
