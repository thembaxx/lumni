"use client";

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/shared";

const tiers = [
	{
		name: "Free",
		price: "R0",
		features: [
			"AI-generated practice quizzes",
			"Past exam papers (limited)",
			"Basic flashcards",
			"Progress tracking",
			"Study planner",
		],
		cta: "Start Free",
		href: "/auth/sign-up",
	},
	{
		name: "Premium",
		price: "R99/mo",
		popular: true,
		features: [
			"Unlimited AI quizzes",
			"All past papers & marking guides",
			"Smart flashcards with spaced repetition",
			"Wrong answer journal & review",
			"Photo math scanner",
			"Advanced analytics & insights",
			"Priority AI tutor access",
			"Ad-free experience",
		],
		cta: "Go Premium",
		href: "/premium",
	},
];

export function PricingComparisonSection() {
	return (
		<section className="bg-system-background-secondary py-20 md:py-28">
			<div className="mx-auto max-w-6xl px-4">
				<m.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="mb-16 text-center"
				>
					<h2 className="ios-title-1 mb-3">Free vs Premium</h2>
					<p className="ios-body mx-auto max-w-lg text-muted-foreground">
						Start free, upgrade when you need more. No lock-in, cancel anytime.
					</p>
				</m.div>

				<div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
					{tiers.map((tier, i) => (
						<m.div
							key={tier.name}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: i * 0.1, duration: 0.4 }}
						>
							<Card
								className={cn(
									"relative h-full",
									tier.popular
										? "border-[--system-accent] bg-linear-to-b from-card to-card/80 shadow-level-2"
										: "border-border/50",
								)}
							>
								{tier.popular && (
									<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--system-accent-alpha-20) px-4 py-1 font-bold text-primary text-xs ring-1 ring-primary/30 ring-inset">
										Most Popular
									</div>
								)}
								<CardHeader className={cn(tier.popular && "pb-0")}>
									<CardTitle className="flex items-baseline gap-2">
										{tier.name}
										<span className="font-normal text-lg text-muted-foreground">
											{tier.price}
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col gap-6">
									<ul className="flex flex-col gap-3">
										{tier.features.map((f) => (
											<li key={f} className="flex items-start gap-2 text-sm">
												<HugeiconsIcon
													icon={CheckmarkCircle01Icon}
													className={cn(
														"mt-0.5 size-4 shrink-0",
														tier.popular ? "text-primary" : "text-success",
													)}
												/>
												{f}
											</li>
										))}
									</ul>
									<Link href={tier.href}>
										<Button
											variant={tier.popular ? "default" : "outline"}
											className="w-full"
										>
											{tier.cta}
										</Button>
									</Link>
								</CardContent>
							</Card>
						</m.div>
					))}
				</div>
			</div>
		</section>
	);
}
