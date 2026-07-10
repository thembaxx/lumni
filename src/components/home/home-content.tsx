"use client";

import Activity02Icon from "@hugeicons/core-free-icons/Activity02Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import Quiz01Icon from "@hugeicons/core-free-icons/Quiz01Icon";
import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useLogoEasterEgg } from "@/lib/shared/easter-egg-context";
import { CELEBRATION_DURATION } from "@/lib/shared/durations";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { MeshAurora } from "@/components/shared/ambient/mesh-aurora";
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
const AnimatedStatsSection = dynamic(
  () => import("./animated-stats-section").then((m) => ({ default: m.AnimatedStatsSection })),
  { ssr: false },
);

/**
 * Easter egg: type "matric" anywhere → confetti celebration
 */
function useMatricEasterEgg() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [, setBuffer] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      setBuffer((prev) => {
        const next = (prev + e.key).toLowerCase();
        if (next.includes("matric")) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), CELEBRATION_DURATION);
          return "";
        }
        return next.slice(-10);
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const dismissConfetti = useCallback(() => setShowConfetti(false), []);

  return { showConfetti, dismissConfetti };
}

function ConfettiCelebration({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  if (!show) return null;

  const colors = [
    "bg-primary",
    "bg-chart-2",
    "bg-chart-3",
    "bg-chart-4",
    "bg-chart-5",
    "bg-success",
  ];

  return (
    <div
      className="fixed inset-0 z-(--z-toast) pointer-events-none"
      onClick={onDismiss}
      role="presentation"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-foreground/10 backdrop-blur-xl px-6 py-4 border border-border/30 shadow-level-3 animate-fade-in-scale">
          <HugeiconsIcon icon={StarIcon} className="size-8 text-primary" />
          <div>
            <p className="font-bold text-lg">You got this!</p>
            <p className="text-muted-foreground text-sm">Keep studying, you're doing great!</p>
          </div>
        </div>
      </div>
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 20}%`,
            background: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
          }}
        />
      ))}
    </div>
  );
}

export function HomeContent() {
  const t = useTranslations();
  const { user, status, authReady } = useAuth();
  const isAuthenticated =
    authReady && status === "authenticated" && !user?.labels?.includes("anonymous");
  const isAnonymous =
    authReady && status === "authenticated" && user?.labels?.includes("anonymous") === true;
  const handleLogoClick = useLogoEasterEgg();
  const { showConfetti, dismissConfetti } = useMatricEasterEgg();

  return (
    <main className="relative min-h-dvh overflow-x-clip pb-16">
      <MeshAurora variant="hero" intensity={0.7} className="fixed inset-0 -z-10" />
      <AmbientGradient variant="hero" />
      <NoiseOverlay opacity={0.02} />
      <ConfettiCelebration show={showConfetti} onDismiss={dismissConfetti} />

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
            className="flex cursor-pointer items-center gap-2 py-2 font-bold text-lg tracking-tight transition-colors"
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-primary transition-[border-radius] duration-300 hover:rounded-lg">
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
      <Suspense fallback={<div className="h-48 animate-pulse bg-muted/30" />}>
        <AnimatedStatsSection />
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
    </main>
  );
}
