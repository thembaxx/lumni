"use client";

import { Cancel01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePWAInstall, useServiceWorker } from "@/hooks/use-service-worker";

export function PWAUpdateToast() {
	const { isUpdated, skipWaiting } = useServiceWorker();
	const [dismissed, setDismissed] = useState(false);

	if (!isUpdated || dismissed) return null;

	return (
		<div
			className="fixed right-4 bottom-4 left-4 z-toast md:right-4 md:left-auto md:max-w-sm"
			role="alert"
		>
			<div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 shadow-level-2">
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
					aria-label="Dismiss update notification"
				>
					<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
				</Button>
			</div>
		</div>
	);
}

const FEATURES = [
	"AI-powered quizzes & flashcards",
	"Matric exam papers with marking memos",
	"Offline access — no data needed",
	"Personalised study plan & progress tracking",
];

export function PWAInstallPrompt() {
	const { isInstallable, install, dismissed, dismiss } = usePWAInstall();
	const [dontShowAgain, setDontShowAgain] = useState(false);

	if (!isInstallable || dismissed) return null;

	return (
		<div className="fixed right-4 bottom-4 left-4 z-toast md:right-4 md:left-auto md:max-w-sm">
			<div className="rounded-card-lg border border-border/50 bg-background/80 p-5 shadow-level-2 backdrop-blur-xl">
				<div className="flex items-start gap-3">
					<div className="flex-shrink-0">
						<Image
							src="/logo.png"
							alt="Lumni"
							width={48}
							height={48}
							className="size-12 rounded-xl"
						/>
					</div>
					<div className="flex-1">
						<p className="font-bold text-base">Install Lumni</p>
						<p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
							Add to your home screen for the best experience — study anytime,
							even offline.
						</p>
					</div>
				</div>

				<ul className="mt-4 space-y-2">
					{FEATURES.map((f) => (
						<li
							key={f}
							className="flex items-start gap-2 text-foreground/80 text-xs"
						>
							<svg
								className="mt-0.5 size-3.5 shrink-0 text-[--system-accent]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2.5}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<span>{f}</span>
						</li>
					))}
				</ul>

				<div className="mt-4 flex items-center gap-2">
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

				<div className="mt-4 flex gap-2">
					<Button
						size="sm"
						className="flex-1"
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
