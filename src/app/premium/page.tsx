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
import { PageContainer } from "@/components/layout/page-container";
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
	const { isPremium, downgrade, createCheckoutSession, cancelSubscription } =
		usePremium();
	const { push, refresh } = useRouter();
	const [loading, setLoading] = useState(false);

	const handleUpgrade = async () => {
		setLoading(true);
		try {
			const url = await createCheckoutSession();
			if (url) {
				window.location.href = url;
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
			refresh();
		} finally {
			setLoading(false);
		}
	};

	return (
		<PageContainer className="flex min-h-dvh justify-center bg-background py-6">
			<Card>
				<CardHeader className="text-center">
					<div className="mb-3 flex justify-center">
						<HugeiconsIcon
							icon={CrownIcon}
							size={40}
							className="text-amber-400"
						/>
					</div>
					<CardTitle className="text-2xl">
						{isPremium ? "You're Premium" : "Upgrade to Premium"}
					</CardTitle>
					<p className="mt-1 text-muted-foreground text-sm">
						{isPremium
							? "Enjoy all premium features"
							: "Unlock the full Lumni experience"}
					</p>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{FEATURES.map((f) => (
						<div key={f.label} className="flex items-start gap-3">
							<HugeiconsIcon
								icon={f.icon}
								size={18}
								className="mt-0.5 text-amber-400"
							/>
							<div>
								<p className="font-medium text-sm">{f.label}</p>
								<p className="text-muted-foreground text-xs">{f.desc}</p>
							</div>
						</div>
					))}

					<div className="border-border/30 border-t pt-4">
						<button
							type="button"
							onClick={() => push("/settings")}
							className="flex w-full items-center justify-between rounded-xl border border-accent/20 bg-accent/5 p-3 text-left transition-colors hover:bg-accent/10"
						>
							<div className="flex items-center gap-3">
								<HugeiconsIcon
									icon={Share07Icon}
									size={18}
									className="text-accent"
								/>
								<div>
									<p className="font-medium text-sm">Get Premium free</p>
									<p className="text-muted-foreground text-xs">
										Refer a friend and earn 7 days each
									</p>
								</div>
							</div>
							<span className="font-medium text-accent text-xs">Invite →</span>
						</button>
					</div>

					<div className="flex flex-col gap-2 pt-2">
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
								{loading ? "Redirecting…" : "Upgrade Now"}
							</Button>
						)}
						<Button variant="ghost" onClick={() => push("/dashboard")}>
							Back to Dashboard
						</Button>
					</div>
				</CardContent>
			</Card>
		</PageContainer>
	);
}
