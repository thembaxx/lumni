"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { type PremiumFeature, usePremium } from "@/lib/premium/premium-context";
import { cn } from "@/lib/shared";

interface ContentLockProps {
	feature: PremiumFeature;
	children: ReactNode;
	preview?: ReactNode;
	upgrade?: ReactNode;
	className?: string;
}

export function ContentLock({
	feature,
	children,
	preview,
	upgrade,
	className,
}: ContentLockProps) {
	const { hasFeature } = usePremium();
	const router = useRouter();

	if (hasFeature(feature)) {
		return <>{children}</>;
	}

	return (
		<div className={cn("relative overflow-hidden rounded-xl", className)}>
			<div className="pointer-events-none select-none blur-sm">
				{preview ?? children}
			</div>
			<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 p-6 backdrop-blur-xs">
				{upgrade ?? (
					<>
						<p className="max-w-xs text-balance text-center font-medium text-sm">
							Upgrade to Premium to unlock this feature
						</p>
						<Button onClick={() => router.push("/premium")} size="sm">
							Upgrade
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
