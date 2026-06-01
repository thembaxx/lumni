"use client";

import {
	Activity02Icon,
	ArrowRight01Icon,
	Quiz01Icon,
	StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { FeaturesGrid } from "./features-grid";
import { HeroSection } from "./hero-section";
import { HowItWorksSection } from "./how-it-works-section";
import { PricingComparisonSection } from "./pricing-comparison-section";
import { SiteFooter } from "./site-footer";
import { TestimonialsSection } from "./testimonials-section";

export function HomeContent() {
	const t = useTranslations();
	const { user, status, authReady } = useAuth();
	const isAuthenticated =
		authReady &&
		status === "authenticated" &&
		!user?.labels?.includes("anonymous");
	const isAnonymous =
		authReady &&
		status === "authenticated" &&
		user?.labels?.includes("anonymous") === true;

	return (
		<div className="min-h-screen overflow-x-hidden bg-background pb-16">
			<nav className="glass-thin fixed top-0 right-0 left-0 z-header border-border/50 border-b">
				<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
					<Link
						href="/"
						className="flex items-center gap-2 py-2 font-extrabold text-lg tracking-tight transition-colors"
					>
						<div className="flex size-7 items-center justify-center rounded-md bg-primary">
							<HugeiconsIcon
								icon={StarIcon}
								className="size-4 text-primary-foreground"
							/>
						</div>
						<span>{t("home.brand")}</span>
					</Link>
					<div className="flex items-center gap-1.5">
						{isAuthenticated ? (
							<Link href="/dashboard">
								<Button size="sm" className="flex items-center">
									<HugeiconsIcon icon={Activity02Icon} className="size-5" />
									{t("home.navDashboard")}
								</Button>
							</Link>
						) : isAnonymous ? (
							<>
								<Link href="/quiz">
									<Button
										size="sm"
										variant="ghost"
										className="flex items-center"
									>
										<HugeiconsIcon icon={Quiz01Icon} className="size-5" />
										Try a Quiz
									</Button>
								</Link>
								<Link href="/auth/sign-up">
									<Button size="sm">{t("home.navGetStarted")}</Button>
								</Link>
							</>
						) : (
							<>
								<Link href="/auth/sign-in">
									<Button variant="ghost" size="sm">
										{t("home.navSignIn")}
									</Button>
								</Link>
								<Link href="/auth/sign-up">
									<Button size="sm">
										{t("home.navGetStarted")}
										<HugeiconsIcon
											icon={ArrowRight01Icon}
											data-icon="inline-end"
										/>
									</Button>
								</Link>
							</>
						)}
					</div>
				</div>
			</nav>

			<HeroSection isAuthenticated={isAuthenticated || isAnonymous} />
			<FeaturesGrid />
			<HowItWorksSection />
			<TestimonialsSection />
			<PricingComparisonSection />

			<section className="relative py-16 md:py-20">
				<div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent" />
				<div className="relative mx-auto max-w-2xl px-4 text-center">
					<m.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
					>
						<h2 className="ios-title-1 mb-4">Ready to ace your exams?</h2>
						<p className="ios-body mx-auto mb-8 max-w-md text-muted-foreground">
							Join thousands of Matric students already preparing with Lumni.
							Start free, no credit card required.
						</p>
						<div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
							<Link
								href={
									isAuthenticated || isAnonymous
										? "/dashboard"
										: "/auth/sign-up"
								}
							>
								<Button size="lg">
									{isAuthenticated || isAnonymous
										? t("home.heroDashboard")
										: t("home.heroStartFree")}
									<HugeiconsIcon
										icon={ArrowRight01Icon}
										data-icon="inline-end"
									/>
								</Button>
							</Link>
							{!isAuthenticated && (
								<Link href="/auth/sign-in">
									<Button variant="ghost" size="lg">
										{t("home.navSignIn")}
									</Button>
								</Link>
							)}
						</div>
					</m.div>
				</div>
			</section>

			<SiteFooter />
		</div>
	);
}
