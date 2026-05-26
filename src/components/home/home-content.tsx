"use client";

import { Activity02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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

	return (
		<div className="min-h-screen overflow-x-hidden bg-background">
			<nav className="glass-regular fixed top-0 right-0 left-0 z-header border-border/50 border-b bg-background/80">
				<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
					<Link
						href="/"
						className="py-2 font-extrabold text-lg tracking-tight transition-colors hover:text-primary"
					>
						{t("home.brand")}
					</Link>
					<div className="flex items-center gap-2">
						{isAuthenticated ? (
							<Link href="/dashboard">
								<Button size="sm" className="flex items-center">
									<HugeiconsIcon icon={Activity02Icon} className="size-5" />
									{t("home.navDashboard")}
								</Button>
							</Link>
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

			<HeroSection isAuthenticated={isAuthenticated} />
			<FeaturesGrid />
			<HowItWorksSection />
			<TestimonialsSection />
			<PricingComparisonSection />
			<SiteFooter />
		</div>
	);
}
