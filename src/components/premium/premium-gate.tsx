"use client";

import { CrownIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PremiumFeature } from "@/lib/premium/premium-context";
import { usePremium } from "@/lib/premium/premium-context";

interface PremiumGateProps {
	feature: PremiumFeature;
	fallback?: React.ReactNode;
	children: React.ReactNode;
}

export function PremiumGate({ feature, fallback, children }: PremiumGateProps) {
	const { hasFeature } = usePremium();

	if (hasFeature(feature)) {
		return <>{children}</>;
	}

	if (fallback) {
		return <>{fallback}</>;
	}

	return (
		<Card className="flex flex-col items-center gap-4 p-8 text-center">
			<HugeiconsIcon icon={CrownIcon} className="size-10 text-amber-400" />
			<div>
				<p className="font-semibold text-lg">Premium Feature</p>
				<p className="mt-1 text-muted-foreground text-sm">
					Upgrade to Premium to access this feature.
				</p>
			</div>
			<Button asChild>
				<Link href="/premium">
					<HugeiconsIcon icon={CrownIcon} data-icon="inline-start" />
					Upgrade Now
				</Link>
			</Button>
		</Card>
	);
}
