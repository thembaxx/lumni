"use client";

import {
	Activity02Icon,
	ArrowRight01Icon,
	Quiz01Icon,
	StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { CtaSection } from "./cta-section";
import { FeaturesGrid } from "./features-grid";
import { HeroSection } from "./hero-section";
import { HowItWorksSection } from "./how-it-works-section";
import { PricingComparisonSection } from "./pricing-comparison-section";
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
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[var(--z-skip-link)] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
			>
				{t("home.skipToContent")}
			</a>
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
					<div
						className="flex items-center gap-1.5"
						key={isAuthenticated ? "auth" : isAnonymous ? "anon" : "guest"}
					>
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
										{t("home.navTryQuiz")}
									</Button>
								</Link>
								<Link href="/dashboard">
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
								<Link href="/dashboard">
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

			<CtaSection isAuthenticated={isAuthenticated || isAnonymous} />
		</div>
	);
}
