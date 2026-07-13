"use client";

import Activity02Icon from "@hugeicons/core-free-icons/Activity02Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import Quiz01Icon from "@hugeicons/core-free-icons/Quiz01Icon";
import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
const CtaSection = dynamic(() => import("./cta-section").then((m) => ({ default: m.CtaSection })), {
  ssr: false,
});
const AnimatedStatsSection = dynamic(
  () => import("./animated-stats-section").then((m) => ({ default: m.AnimatedStatsSection })),
  { ssr: false },
);

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
      className="pointer-events-none fixed inset-0 z-(--z-toast)"
      onClick={onDismiss}
      role="presentation"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-border/30 bg-foreground/10 px-6 py-4 shadow-level-3 backdrop-blur-xl animate-fade-in-scale">
          <HugeiconsIcon icon={StarIcon} className="size-8 text-primary" />
          <div>
            <p className="font-bold text-lg">You got this!</p>
            <p className="text-sm text-muted-foreground">Keep studying, you&apos;re doing great!</p>
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
  const [scrolled, setScrolled] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 40);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="relative min-h-dvh w-full max-w-full overflow-x-clip">
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

      <nav
        className={`fixed top-4 right-0 left-0 z-header mx-auto flex w-fit items-center justify-center gap-6 rounded-full border px-4 py-2 transition-all duration-500 ${
          scrolled
            ? "border-border/20 bg-card/80 shadow-level-2 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex cursor-pointer items-center gap-2 py-1 font-bold text-sm tracking-tight transition-colors"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary transition-[border-radius] duration-300 hover:rounded-lg">
            <HugeiconsIcon icon={StarIcon} className="size-3.5 text-primary-foreground" />
          </div>
          <span>{t("home.brand")}</span>
        </button>

        <div className="hidden items-center gap-1 md:flex" role="list">
          <Link
            href="/quiz"
            className="rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Quiz
          </Link>
          <Link
            href="/past-papers"
            className="rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Papers
          </Link>
          <Link
            href="/flashcards"
            className="rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Flashcards
          </Link>
        </div>

        <div
          className="flex items-center gap-1.5"
          key={isAuthenticated ? "auth" : isAnonymous ? "anon" : "guest"}
        >
          {isAuthenticated ? (
            <Button asChild size="sm" className="flex items-center rounded-full">
              <Link href="/dashboard" prefetch={true}>
                <HugeiconsIcon icon={Activity02Icon} className="size-4" />
                {t("home.navDashboard")}
              </Link>
            </Button>
          ) : isAnonymous ? (
            <>
              <Button asChild size="sm" variant="ghost" className="flex items-center rounded-full">
                <Link href="/quiz" prefetch={true}>
                  <HugeiconsIcon icon={Quiz01Icon} className="size-4" />
                  {t("home.navTryQuiz")}
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link href="/dashboard" prefetch={true}>
                  {t("home.navGetStarted")}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/auth/sign-in">{t("home.navSignIn")}</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link href="/dashboard" prefetch={true}>
                  {t("home.navGetStarted")}
                  <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                </Link>
              </Button>
            </>
          )}
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
      <Suspense fallback={<div className="h-48 animate-pulse bg-muted/30" />}>
        <CtaSection isAuthenticated={isAuthenticated || isAnonymous} />
      </Suspense>
    </main>
  );
}
