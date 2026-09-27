"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Nav } from "@/components/ui/nav";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroSection } from "./hero-section";
import { SiteFooter } from "./site-footer";
import { useAuth } from "@/lib/auth/auth-context";

const FeaturesGrid = dynamic(
  () => import("./features-grid").then((m) => ({ default: m.FeaturesGrid })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full rounded-lg" /> },
);
const HowItWorksSection = dynamic(
  () => import("./how-it-works-section").then((m) => ({ default: m.HowItWorksSection })),
  { ssr: false, loading: () => <Skeleton className="h-80 w-full rounded-lg" /> },
);
const TestimonialsSection = dynamic(
  () => import("./testimonials-section").then((m) => ({ default: m.TestimonialsSection })),
  { ssr: false, loading: () => <Skeleton className="h-80 w-full rounded-lg" /> },
);
const CtaSection = dynamic(() => import("./cta-section").then((m) => ({ default: m.CtaSection })), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full rounded-lg" />,
});
const AnimatedStatsSection = dynamic(
  () => import("./animated-stats-section").then((m) => ({ default: m.AnimatedStatsSection })),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-lg" /> },
);

export function HomeContent() {
  const t = useTranslations();
  const { user, status, authReady } = useAuth();
  const isAuthenticated =
    authReady && status === "authenticated" && !user?.labels?.includes("anonymous");

  return (
    <main className="relative min-h-dvh w-full max-w-full overflow-x-clip bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-(--z-skip-link) focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        {t("home.skipToContent")}
      </a>

      <Nav />

      <div>
        <HeroSection isAuthenticated={isAuthenticated} />
        <FeaturesGrid />
        <AnimatedStatsSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CtaSection isAuthenticated={isAuthenticated} />
        <SiteFooter />
      </div>
    </main>
  );
}
