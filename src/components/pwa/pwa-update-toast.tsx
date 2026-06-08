"use client";

import { Cancel01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePWAInstall, useServiceWorker } from "@/hooks/use-service-worker";

export function PWAUpdateToast() {
	const { isUpdated, skipWaiting } = useServiceWorker();
	const [dismissed, setDismissed] = useState(false);

	if (!isUpdated || dismissed) return null;

	return (
		<div className="fixed right-4 bottom-4 left-4 z-toast md:right-4 md:left-auto md:max-w-sm">
			<div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 shadow-lg">
				<div className="mt-0.5 flex-shrink-0">
					<HugeiconsIcon
						icon={RefreshIcon}
						className="size-5 text-foreground"
					/>
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-medium text-sm">Update Available</p>
					<p className="mt-1 text-muted-foreground text-xs">
						A new version is ready. Refresh to get the latest features.
					</p>
					<div className="mt-3 flex gap-2">
						<Button
							size="sm"
							onClick={() => {
								skipWaiting();
								window.location.reload();
							}}
						>
							Refresh Now
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setDismissed(true)}
						>
							Later
						</Button>
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={() => setDismissed(true)}
				>
					<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
				</Button>
			</div>
		</div>
	);
}

export function PWAInstallPrompt() {
	const { isInstallable, install, dismissed, dismiss } = usePWAInstall();
	const [dontShowAgain, setDontShowAgain] = useState(false);

	if (!isInstallable || dismissed) return null;

	return (
		<div className="fixed right-4 bottom-4 left-4 z-toast md:right-4 md:left-auto md:max-w-sm">
			<div className="rounded-lg border border-border bg-background p-4 shadow-lg">
				<div className="flex items-center gap-3">
					<div className="flex-shrink-0">
						<div className="flex size-10 items-center justify-center rounded-lg bg-[--system-accent]/10">
							<span className="text-xl">📱</span>
						</div>
					</div>
					<div className="flex-1">
						<p className="font-medium text-sm">Install Lumni</p>
						<p className="text-muted-foreground text-xs">
							Add to home screen for offline access
						</p>
					</div>
				</div>
				<div className="mt-3 flex items-center gap-2">
					<Checkbox
						id="pwa-dont-show-again"
						checked={dontShowAgain}
						onCheckedChange={(checked) => setDontShowAgain(checked === true)}
					/>
					<label
						htmlFor="pwa-dont-show-again"
						className="cursor-pointer text-muted-foreground text-xs"
					>
						Don&apos;t show again
					</label>
				</div>
				<div className="mt-3 flex gap-2">
					<Button
						size="sm"
						onClick={() => {
							if (dontShowAgain) {
								localStorage.setItem("pwa-install-dismissed", "true");
							}
							install();
						}}
					>
						Install
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => dismiss(dontShowAgain)}
					>
						Not now
					</Button>
				</div>
			</div>
		</div>
	);
}
