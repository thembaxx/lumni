"use client";

import {
	Award01Icon,
	CrownIcon,
	FireIcon,
	HeadphonesIcon,
	Share07Icon,
	StarsIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";
import { usePremium } from "@/lib/premium/premium-context";
import { cn } from "@/lib/shared";

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
	{
		icon: HeadphonesIcon,
		label: "Priority Support",
		desc: "Faster response times and dedicated help",
	},
];

type BillingPeriod = "monthly" | "yearly";

export default function PremiumPage() {
	const {
		isPremium,
		downgrade,
		createCheckoutSession,
		createPayfastCheckoutSession,
		cancelSubscription,
	} = usePremium();
	const { push, refresh } = useRouter();
	const [loading, setLoading] = useState(false);
	const [payfastLoading, setPayfastLoading] = useState(false);
	const [billing, setBilling] = useState<BillingPeriod>("monthly");

	const handleUpgrade = async () => {
		setLoading(true);
		try {
			const url = await createCheckoutSession(billing);
			if (url) {
				window.location.href = url;
			}
		} finally {
			setLoading(false);
		}
	};

	const handlePayfastUpgrade = async () => {
		setPayfastLoading(true);
		try {
			const result = await createPayfastCheckoutSession(billing);
			if (result) {
				const form = document.createElement("form");
				form.method = "POST";
				form.action = result.url;
				form.style.display = "none";
				for (const [key, value] of Object.entries(result.data)) {
					const input = document.createElement("input");
					input.type = "hidden";
					input.name = key;
					input.value = value;
					form.appendChild(input);
				}
				document.body.appendChild(form);
				form.submit();
			}
		} finally {
			setPayfastLoading(false);
		}
	};

	const handleCancel = async () => {
		setLoading(true);
		try {
			const ok = await cancelSubscription();
			if (ok) {
				await downgrade();
				refresh();
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<PageContainer className="flex min-h-dvh justify-center bg-background py-6">
			<AppErrorBoundary>
				<Card>
					<CardHeader className="text-center">
						<div className="mb-3 flex justify-center">
							<HugeiconsIcon
								icon={CrownIcon}
								size={40}
								className="text-amber-400 dark:text-amber-300"
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
									className="mt-0.5 text-amber-400 dark:text-amber-300"
								/>
								<div>
									<p className="font-medium text-sm">{f.label}</p>
									<p className="text-muted-foreground text-xs">{f.desc}</p>
								</div>
							</div>
						))}

						{!isPremium && (
							<div className="flex rounded-xl border border-border p-1">
								<button
									type="button"
									onClick={() => setBilling("monthly")}
									className={cn(
										"flex-1 rounded-lg py-2 text-center font-medium text-sm transition-colors",
										billing === "monthly"
											? "bg-[--system-accent] text-white"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									R99 / mo
								</button>
								<button
									type="button"
									onClick={() => setBilling("yearly")}
									className={cn(
										"flex-1 rounded-lg py-2 text-center font-medium text-sm transition-colors",
										billing === "yearly"
											? "bg-[--system-accent] text-white"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									R999 / yr
									<span className="ios-caption-3 ml-1 opacity-80">
										(save 16%)
									</span>
								</button>
							</div>
						)}

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
								<span className="font-medium text-accent text-xs">
									Invite →
								</span>
							</button>
						</div>

						<div className="flex flex-col gap-2 pt-2">
							{isPremium ? (
								<>
									<Button asChild variant="outline">
										<Link href="/support">
											<HugeiconsIcon
												icon={HeadphonesIcon}
												data-icon="inline-start"
											/>
											Get Support
										</Link>
									</Button>
									<Button
										variant="destructive"
										onClick={handleCancel}
										disabled={loading}
									>
										Cancel Premium
									</Button>
								</>
							) : (
								<>
									<Button onClick={handleUpgrade} disabled={loading}>
										<HugeiconsIcon icon={CrownIcon} data-icon="inline-start" />
										{loading
											? "Redirecting…"
											: `Upgrade with Card (${billing === "monthly" ? "R99/mo" : "R999/yr"})`}
									</Button>
									<Button
										onClick={handlePayfastUpgrade}
										disabled={payfastLoading}
										variant="outline"
									>
										{payfastLoading
											? "Redirecting…"
											: `Pay with Payfast (${billing === "monthly" ? "R99/mo" : "R999/yr"})`}
									</Button>
								</>
							)}
							<Button variant="ghost" onClick={() => push("/dashboard")}>
								Back to Dashboard
							</Button>
						</div>
					</CardContent>
				</Card>
			</AppErrorBoundary>
		</PageContainer>
	);
}
