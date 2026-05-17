"use client";

import { Cancel01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePWAInstall, useServiceWorker } from "@/hooks/use-service-worker";

export function PWAUpdateToast() {
	const { isUpdated, skipWaiting } = useServiceWorker();
	const [dismissed, setDismissed] = useState(false);

	if (!isUpdated || dismissed) return null;

	return (
		<div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
			<div className="bg-background border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
				<div className="flex-shrink-0 mt-0.5">
					<HugeiconsIcon
						icon={RefreshIcon}
						className="h-5 w-5 text-foreground"
					/>
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium">Update Available</p>
					<p className="text-xs text-muted-foreground mt-1">
						A new version is ready. Refresh to get the latest features.
					</p>
					<div className="flex gap-2 mt-3">
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
					<HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

export function PWAInstallPrompt() {
	const { isInstallable, install, dismissed } = usePWAInstall();

	if (!isInstallable || dismissed) return null;

	return (
		<div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
			<div className="bg-background border border-border rounded-lg shadow-lg p-4">
				<div className="flex items-center gap-3">
					<div className="flex-shrink-0">
						<div className="w-10 h-10 bg-[--system-accent]/10 rounded-lg flex items-center justify-center">
							<span className="text-xl">📱</span>
						</div>
					</div>
					<div className="flex-1">
						<p className="text-sm font-medium">Install Lumni</p>
						<p className="text-xs text-muted-foreground">
							Add to home screen for offline access
						</p>
					</div>
				</div>
				<div className="flex gap-2 mt-3">
					<Button size="sm" onClick={install}>
						Install
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							localStorage.setItem("pwa-install-dismissed", "true")
						}
					>
						Not now
					</Button>
				</div>
			</div>
		</div>
	);
}
