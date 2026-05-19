"use client";

import {
	Award01Icon,
	CrownIcon,
	FireIcon,
	Share07Icon,
	StarsIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
	const {
		isPremium,
		upgrade,
		downgrade,
		createCheckoutSession,
		cancelSubscription,
	} = usePremium();
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const handleUpgrade = async () => {
		setLoading(true);
		try {
			const url = await createCheckoutSession();
			if (url) {
				window.location.href = url;
			} else {
				await upgrade();
				router.refresh();
			}
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = async () => {
		setLoading(true);
		try {
			await cancelSubscription();
			await downgrade();
			router.refresh();
		} finally {
			setLoading(false);
		}
	};

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

					<div className="pt-4 border-t border-border/30">
						<button
							onClick={() => router.push("/settings")}
							className="w-full flex items-center justify-between p-3 rounded-xl bg-accent/5 hover:bg-accent/10 border border-accent/20 transition-colors text-left"
						>
							<div className="flex items-center gap-3">
								<HugeiconsIcon
									icon={Share07Icon}
									size={18}
									className="text-accent"
								/>
								<div>
									<p className="font-medium text-sm">Get Premium free</p>
									<p className="text-xs text-muted-foreground">
										Refer a friend and earn 7 days each
									</p>
								</div>
							</div>
							<span className="text-xs font-medium text-accent">Invite →</span>
						</button>
					</div>

					<div className="pt-2 flex flex-col gap-2">
						{isPremium ? (
							<Button
								variant="destructive"
								onClick={handleCancel}
								disabled={loading}
							>
								Cancel Premium
							</Button>
						) : (
							<Button onClick={handleUpgrade} disabled={loading}>
								<HugeiconsIcon icon={CrownIcon} data-icon="inline-start" />
								{loading ? "Redirecting..." : "Upgrade Now"}
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
