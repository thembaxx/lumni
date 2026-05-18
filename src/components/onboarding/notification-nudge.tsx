"use client";

import { BellElectricIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/use-onboarding";
import { iOSEase } from "@/lib/utils/animation";

const NUDGE_DISMISSED_KEY = "lumni_notification_nudge_dismissed";

export function NotificationNudge() {
	const router = useRouter();
	const { data } = useOnboarding();
	const [dismissed, setDismissed] = useState(true);

	useEffect(() => {
		const dismissedRaw = localStorage.getItem(NUDGE_DISMISSED_KEY);
		if (dismissedRaw === "true") {
			setDismissed(true);
			return;
		}
		if (data.isComplete && !data.notificationsEnabled) {
			setDismissed(false);
		} else {
			setDismissed(true);
		}
	}, [data.isComplete, data.notificationsEnabled]);

	if (dismissed) return null;

	const handleDismiss = () => {
		localStorage.setItem(NUDGE_DISMISSED_KEY, "true");
		setDismissed(true);
	};

	const handleEnable = () => {
		router.push("/settings");
		handleDismiss();
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: iOSEase }}
			className="flex items-center gap-3 px-4 py-3 rounded-xl bg-system-accent/8 border border-system-accent/15"
		>
			<div className="size-8 rounded-full bg-system-accent/15 flex items-center justify-center shrink-0">
				<HugeiconsIcon
					icon={BellElectricIcon}
					className="size-4 text-system-accent"
				/>
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold text-balance">
					Enable study reminders
				</p>
				<p className="text-xs text-muted-foreground">
					Get daily nudges to keep your streak alive.
				</p>
			</div>
			<div className="flex items-center gap-1 shrink-0">
				<Button
					size="sm"
					variant="default"
					className="text-xs h-8 px-3"
					onClick={handleEnable}
				>
					Enable
				</Button>
				<button
					type="button"
					onClick={handleDismiss}
					className="-mr-1.5 p-2 rounded-md hover:bg-muted/50 transition-colors"
					aria-label="Dismiss"
				>
					<HugeiconsIcon
						icon={Cancel01Icon}
						className="size-4 text-muted-foreground"
					/>
				</button>
			</div>
		</motion.div>
	);
}
