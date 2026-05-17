"use client";

import {
	Award01Icon,
	CrownIcon,
	FireIcon,
	StarsIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePremium } from "@/lib/premium/premium-context";

const FEATURES = [
	{
		icon: StarsIcon,
		label: "AI Tutor",
		desc: "Personalised AI tutoring sessions",
	},
	{
		icon: FireIcon,
		label: "Advanced Analytics",
		desc: "Detailed performance breakdowns",
	},
	{
		icon: Award01Icon,
		label: "Exam Simulator",
		desc: "Full mock exam simulations",
	},
	{
		icon: CrownIcon,
		label: "Custom Study Plans",
		desc: "AI-optimised study schedules",
	},
];

export default function PremiumPage() {
	const { isPremium, upgrade, downgrade } = usePremium();
	const router = useRouter();

	return (
		<div className="min-h-dvh bg-background p-6 max-w-2xl mx-auto flex flex-col justify-center">
			<Card>
				<CardHeader className="text-center">
					<div className="flex justify-center mb-3">
						<HugeiconsIcon
							icon={CrownIcon}
							size={40}
							className="text-amber-400"
						/>
					</div>
					<CardTitle className="text-2xl">
						{isPremium ? "You're Premium" : "Upgrade to Premium"}
					</CardTitle>
					<p className="text-muted-foreground text-sm mt-1">
						{isPremium
							? "Enjoy all premium features"
							: "Unlock the full Lumni experience"}
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					{FEATURES.map((f) => (
						<div key={f.label} className="flex items-start gap-3">
							<HugeiconsIcon
								icon={f.icon}
								size={18}
								className="text-amber-400 mt-0.5"
							/>
							<div>
								<p className="font-medium text-sm">{f.label}</p>
								<p className="text-xs text-muted-foreground">{f.desc}</p>
							</div>
						</div>
					))}
					<div className="pt-4 flex flex-col gap-2">
						{isPremium ? (
							<Button variant="destructive" onClick={downgrade}>
								Cancel Premium
							</Button>
						) : (
							<Button onClick={upgrade}>
								<HugeiconsIcon icon={CrownIcon} data-icon="inline-start" />
								Upgrade Now
							</Button>
						)}
						<Button variant="ghost" onClick={() => router.push("/dashboard")}>
							Back to Dashboard
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
