"use client";

import { CrownIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PremiumFeature } from "@/lib/premium/premium-context";
import { usePremium } from "@/lib/premium/premium-context";

interface PremiumGateProps {
	feature: PremiumFeature;
	children: React.ReactNode;
	fallback?: React.ReactNode;
	showUpsell?: boolean;
}

export function PremiumGate({
	feature,
	children,
	fallback,
	showUpsell = true,
}: PremiumGateProps) {
	const { hasFeature, createCheckoutSession } = usePremium();
	const t = useTranslations();

	if (hasFeature(feature)) {
		return <>{children}</>;
	}

	if (fallback) {
		return <>{fallback}</>;
	}

	if (!showUpsell) {
		return null;
	}

	return (
		<Card className="relative overflow-hidden border-dashed">
			<div className="absolute inset-0 bg-gradient-to-b from-system-accent/5 to-transparent" />
			<CardContent className="relative flex flex-col items-center gap-3 p-6 text-center">
				<div className="flex size-10 items-center justify-center rounded-full bg-system-accent/10">
					<HugeiconsIcon
						icon={CrownIcon}
						className="size-5 text-system-accent"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<h3 className="font-semibold text-sm">{t("premium.gatedTitle")}</h3>
					<p className="text-muted-foreground text-xs">
						{t("premium.gatedDescription", { feature })}
					</p>
				</div>
				<Button
					size="sm"
					onClick={async () => {
						const url = await createCheckoutSession("yearly");
						if (url) window.location.href = url;
					}}
				>
					{t("premium.upgrade")}
				</Button>
			</CardContent>
		</Card>
	);
}

export function PremiumBadge({ feature }: { feature: PremiumFeature }) {
	const { hasFeature } = usePremium();

	if (hasFeature(feature)) {
		return null;
	}

	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-system-accent/10 px-2 py-0.5 text-system-accent text-xs">
			<HugeiconsIcon icon={CrownIcon} className="size-3" />
			Premium
		</span>
	);
}
