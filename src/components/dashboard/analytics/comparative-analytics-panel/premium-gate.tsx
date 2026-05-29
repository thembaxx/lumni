"use client";

import { CrownIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export function PremiumGate() {
	return (
		<Card className="flex flex-col items-center gap-4 p-8 text-center">
			<HugeiconsIcon
				icon={CrownIcon}
				className="size-10 text-amber-400 dark:text-amber-300"
			/>
			<div>
				<p className="font-semibold text-lg">Premium Feature</p>
				<p className="mt-1 text-muted-foreground text-sm">
					Comparative analytics and peer performance insights are available on
					Premium.
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
