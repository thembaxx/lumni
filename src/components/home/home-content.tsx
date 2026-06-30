"use client";

import Activity02Icon from "@hugeicons/core-free-icons/Activity02Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import Quiz01Icon from "@hugeicons/core-free-icons/Quiz01Icon";
import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useLogoEasterEgg } from "@/lib/shared/easter-egg-context";
import { HeroSection } from "./hero-section";

const FeaturesGrid = dynamic(
  () => import("./features-grid").then((m) => ({ default: m.FeaturesGrid })),
  { ssr: false },
);
const HowItWorksSection = dynamic(
  () =>
    import("./how-it-works-section").then((m) => ({
      default: m.HowItWorksSection,
    })),
  { ssr: false },
);
const TestimonialsSection = dynamic(
  () =>
    import("./testimonials-section").then((m) => ({
      default: m.TestimonialsSection,
    })),
  { ssr: false },
);
const FeatureShowcaseSection = dynamic(
  () =>
    import("./feature-showcase-section").then((m) => ({
      default: m.FeatureShowcaseSection,
    })),
  { ssr: false },
);
const CtaSection = dynamic(() => import("./cta-section").then((m) => ({ default: m.CtaSection })), {
  ssr: false,
});

export function HomeContent() {
  const t = useTranslations();
  const { user, status, authReady } = useAuth();
  const isAuthenticated =
    authReady && status === "authenticated" && !user?.labels?.includes("anonymous");
  const isAnonymous =
    authReady && status === "authenticated" && user?.labels?.includes("anonymous") === true;
  const handleLogoClick = useLogoEasterEgg();

  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-16">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-skip-link) focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        {t("home.skipToContent")}
      </a>
      <nav className="glass-thin fixed top-0 right-0 left-0 z-header border-border/50 border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex cursor-pointer items-center gap-2 py-2 font-extrabold text-lg tracking-tight transition-colors"
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-primary transition-all duration-300 hover:rounded-lg">
              <HugeiconsIcon icon={StarIcon} className="size-4 text-primary-foreground" />
            </div>
            <span>{t("home.brand")}</span>
          </button>
          <div
            className="flex items-center gap-1.5"
            key={isAuthenticated ? "auth" : isAnonymous ? "anon" : "guest"}
          >
            {isAuthenticated ? (
              <Button asChild size="sm" className="flex items-center">
                <Link href="/dashboard" prefetch={true}>
                  <HugeiconsIcon icon={Activity02Icon} className="size-5" />
                  {t("home.navDashboard")}
                </Link>
              </Button>
            ) : isAnonymous ? (
              <>
                <Button asChild size="sm" variant="ghost" className="flex items-center">
                  <Link href="/quiz" prefetch={true}>
                    <HugeiconsIcon icon={Quiz01Icon} className="size-5" />
                    {t("home.navTryQuiz")}
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/dashboard" prefetch={true}>
                    {t("home.navGetStarted")}
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/sign-in">{t("home.navSignIn")}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/dashboard" prefetch={true}>
                    {t("home.navGetStarted")}
                    <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <HeroSection isAuthenticated={isAuthenticated || isAnonymous} />
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted/30" />}>
        <FeaturesGrid />
      </Suspense>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted/30" />}>
        <HowItWorksSection />
      </Suspense>
      <Suspense fallback={<div className="h-80 animate-pulse bg-muted/30" />}>
        <TestimonialsSection />
      </Suspense>
      <Suspense fallback={<div className="h-80 animate-pulse bg-muted/30" />}>
        <FeatureShowcaseSection />
      </Suspense>

      <Suspense fallback={<div className="h-48 animate-pulse bg-muted/30" />}>
        <CtaSection isAuthenticated={isAuthenticated || isAnonymous} />
      </Suspense>
    </div>
  );
}
