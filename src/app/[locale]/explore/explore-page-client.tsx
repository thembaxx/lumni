"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { BentoGrid, BentoCell } from "@/components/dashboard/parts/bento-grid";
import { StaggeredSection, StaggerProvider } from "@/components/shared/stagger-provider";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { useAuth } from "@/lib/auth/auth-context";

const QuestionOfTheDayCard = dynamic(
  () =>
    import("@/components/dashboard/question-of-the-day-card").then((m) => m.QuestionOfTheDayCard),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const RecentQuestionsCard = dynamic(
  () => import("@/components/dashboard/recent-questions-card").then((m) => m.RecentQuestionsCard),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const LearningMapCard = dynamic(
  () => import("@/components/dashboard/learning-map-card").then((m) => m.LearningMapCard),
  { ssr: false, loading: () => <Skeleton className="h-56 rounded-card" /> },
);

const CompetitionCard = dynamic(
  () => import("@/components/dashboard/competition-card").then((m) => m.CompetitionCard),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const OfflinePackManager = dynamic(
  () => import("@/components/dashboard/offline-packs").then((m) => m.OfflinePackManager),
  { ssr: false, loading: () => <Skeleton className="h-56 rounded-card" /> },
);

const MyAssignments = dynamic(
  () => import("@/components/dashboard/my-assignments").then((m) => m.MyAssignments),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 sm:mb-3">
      <div className="h-1.5 w-1.5 rounded-full bg-system-accent" aria-hidden="true" />
      <h2 className="font-semibold text-(--fs-caption-1) text-muted-foreground uppercase tracking-widest">
        {label}
      </h2>
    </div>
  );
}

export function ExplorePageClient() {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!user && !isAnonymous;

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Sign in to explore</p>
      </div>
    );
  }

  return (
    <StaggerProvider baseDelay={0.03}>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-heading font-extrabold text-(--fs-heading-2) text-foreground tracking-tight">
            Explore
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Discover questions, maps, competitions, and more
          </p>
        </div>

        <section aria-label="Daily">
          <SectionLabel label="Daily" />
          <BentoGrid>
            <StaggeredSection>
              <QuestionOfTheDayCard />
            </StaggeredSection>
            <BentoCell span="2col">
              <StaggeredSection>
                <RecentQuestionsCard />
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>

        <section aria-label="Learning Map">
          <SectionLabel label="Learning Map" />
          <BentoGrid>
            <BentoCell span="full">
              <StaggeredSection>
                <AppErrorBoundary>
                  <LearningMapCard />
                </AppErrorBoundary>
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>

        <section aria-label="Competition">
          <SectionLabel label="Competition" />
          <BentoGrid>
            <BentoCell span="full">
              <StaggeredSection>
                <AppErrorBoundary>
                  <CompetitionCard />
                </AppErrorBoundary>
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>

        <section aria-label="Offline">
          <SectionLabel label="Offline" />
          <BentoGrid>
            <BentoCell span="full">
              <StaggeredSection>
                <OfflinePackManager />
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>

        <section aria-label="Assignments">
          <SectionLabel label="Assignments" />
          <BentoGrid>
            <BentoCell span="full">
              <StaggeredSection>
                <MyAssignments />
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>
      </div>
    </StaggerProvider>
  );
}
