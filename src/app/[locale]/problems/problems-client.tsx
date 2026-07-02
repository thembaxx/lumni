"use client";

import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import LockIcon from "@hugeicons/core-free-icons/LockIcon";
import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useMemo, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { StepByStep } from "@/components/quiz/step-by-step";
import { Anim } from "@/components/shared/anim";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { EmptyStateWithIllustration } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { SubjectSelect } from "@/components/ui/subject-select";
import { type CuratedProblem, useCuratedProblems } from "@/hooks/use-curated-problems";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useAuth } from "@/lib/auth/auth-context";
import { motionEase } from "@/lib/utils/animation";
import { cn } from "@/lib/utils";

const DIFFICULTIES = ["all", "Easy", "Medium", "Hard"] as const;

const difficultyStyle = {
  Easy: "border-success/30 bg-success/5 text-success",
  Medium: "border-warning/30 bg-warning/5 text-warning",
  Hard: "border-destructive/30 bg-destructive/5 text-destructive",
};

function MagneticCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || prefersReducedMotion) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${y * -4}deg)`;
  };

  const handleMouseLeave = (_e: React.MouseEvent) => {
    if (!ref.current || prefersReducedMotion) return;
    ref.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("transition-transform duration-200 ease-ios will-change-transform", className)}
    >
      {children}
    </div>
  );
}

function ProblemCard({ problem, index }: { problem: CuratedProblem; index: number }) {
  const prefersReducedMotion = useReducedMotion();
  const [showSolution, setShowSolution] = useState(false);
  const diffStyle =
    difficultyStyle[problem.difficulty as keyof typeof difficultyStyle] ?? difficultyStyle.Medium;

  return (
    <m.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{
        delay: prefersReducedMotion ? 0 : index * 0.06,
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: motionEase,
      }}
    >
      <MagneticCard className="overflow-hidden rounded-card-lg border border-border/40 bg-card shadow-level-1 transition-shadow duration-300 hover:shadow-level-2">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 font-mono ios-caption-3 font-semibold uppercase",
                  diffStyle,
                )}
              >
                {problem.difficulty}
              </span>
              {problem.topic && (
                <span className="rounded-full bg-muted/60 px-2.5 py-0.5 ios-caption-3 text-muted-foreground">
                  {problem.topic}
                </span>
              )}
            </div>
            <span className="font-mono text-muted-foreground/60 text-xs">
              #{String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="font-medium text-foreground text-sm leading-relaxed">
            <MarkdownRenderer content={problem.questionText} />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSolution(!showSolution)}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs"
            >
              {showSolution ? "Hide" : "View"} solution
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className={cn(
                  "size-3 transition-transform duration-300",
                  showSolution && "rotate-180",
                )}
              />
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {showSolution && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: motionEase }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                <div className="flex flex-col gap-4 border-border/40 border-t pt-4">
                  <div className="rounded-xl border border-border/30 bg-linear-to-br from-system-background to-system-background-secondary p-4">
                    <div className="mb-2 flex items-center gap-2 ios-caption-3 text-muted-foreground font-semibold uppercase">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      Solution
                    </div>
                    <div className="text-foreground/80 text-sm leading-relaxed">
                      <MarkdownRenderer content={problem.solution} />
                    </div>
                  </div>

                  {problem.steps && problem.steps.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2 ios-caption-3 text-muted-foreground font-semibold uppercase">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="12 2 12 12 16 14" />
                        </svg>
                        Steps
                      </div>
                      <StepByStep steps={problem.steps} />
                    </div>
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </MagneticCard>
    </m.div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-skeleton-wave rounded-card-lg border border-border/30 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-5 w-16 rounded-full bg-muted/60" />
        <div className="h-5 w-14 rounded-full bg-muted/60" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-4 w-full rounded bg-muted/40" />
        <div className="h-4 w-3/4 rounded bg-muted/40" />
        <div className="h-4 w-1/2 rounded bg-muted/40" />
      </div>
    </div>
  );
}

export function ProblemsClient() {
  const { user, isAnonymous } = useAuth();
  const { push } = useNavigationDirection();
  const isLoggedIn = !!user && !isAnonymous;
  const prefersReducedMotion = useReducedMotion();

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [problemCount, setProblemCount] = useState(5);
  const [fetched, setFetched] = useState(false);

  const { data, isPending, error, mutate } = useCuratedProblems();

  const filteredProblems = useMemo(() => {
    if (!data?.problems) return [];
    if (selectedDifficulty === "all") return data.problems;
    return data.problems.filter(
      (p) => p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase(),
    );
  }, [data, selectedDifficulty]);

  const handleGenerate = async () => {
    if (!selectedSubject) return;
    setFetched(true);
    mutate({ subject: selectedSubject, count: problemCount });
  };

  if (!isLoggedIn) {
    return (
      <EmptyStateWithIllustration
        icon={LockIcon}
        title="Sign in to access the Problem Library"
        description="Create an account or sign in to browse curated practice problems with step-by-step solutions."
        action={{
          label: "Sign In",
          onClick: () => push("/auth/sign-in?redirect=/problems"),
        }}
        secondaryAction={{
          label: "Create Account",
          onClick: () => push("/auth/sign-up?redirect=/problems"),
        }}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-system-grouped pt-4 pb-24">
      <AmbientGradient variant="subtle" />
      <PageContainer className="flex flex-col gap-8">
        <Anim>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-(--system-accent-alpha-10) px-3 py-1 ios-caption-3 text-primary">
                <HugeiconsIcon
                  icon={StarIcon}
                  className="size-3.5 text-primary/60"
                  aria-hidden="true"
                />
                AI-curated practice
              </div>
              <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">
                Problem Library
              </h1>
              <p className="ios-subhead text-muted-foreground">
                Browse curated practice problems with step-by-step solutions
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SubjectSelect value={selectedSubject} onChange={setSelectedSubject} />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedSubject || isPending}
                  className="group h-11 shrink-0 gap-2 rounded-xl transition-[background-color,box-shadow,transform] duration-300"
                >
                  {isPending && <HugeiconsIcon icon={RadialIcon} className="size-4 animate-spin" />}
                  <span>{isPending ? "Generating..." : "Generate"}</span>
                </Button>
              </div>

              {selectedSubject && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  className="scrollbar-hide flex items-center gap-2 overflow-x-auto"
                >
                  {DIFFICULTIES.map((d) => (
                    <Button
                      key={d}
                      variant={selectedDifficulty === d ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDifficulty(d)}
                      className="h-8 shrink-0 rounded-lg px-3 text-xs transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {d === "all" ? "All Levels" : d}
                    </Button>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <span className="ios-caption-3 text-muted-foreground/40">Count:</span>
                    {[3, 5, 10].map((n) => (
                      <Button
                        key={n}
                        variant={problemCount === n ? "default" : "outline"}
                        size="xs"
                        onClick={() => setProblemCount(n)}
                        className="relative size-7 rounded-lg p-0 text-xs transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary after:absolute after:-inset-2"
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                </m.div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {!fetched && !isPending && (
              <m.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
              >
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted/40">
                  <HugeiconsIcon
                    icon={BookOpen01Icon}
                    className="size-8 text-muted-foreground/30"
                  />
                </div>
                <p className="text-muted-foreground/60 text-sm">
                  Select a subject and generate curated problems
                </p>
              </m.div>
            )}

            {isPending && (
              <m.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={`skeleton-${i}`} />
                ))}
              </m.div>
            )}

            {error && (
              <m.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-card-lg border border-destructive/20 bg-destructive/5 p-4 text-destructive text-sm"
              >
                <div className="flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Failed to generate problems. Please try again.
                </div>
              </m.div>
            )}

            {data && !isPending && !error && (
              <m.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <p className="ios-caption-3 text-muted-foreground/60">
                    Showing {filteredProblems.length} of {data.problems.length} problems
                    {selectedDifficulty !== "all" && " (filtered)"}
                  </p>
                </div>

                {filteredProblems.length === 0 ? (
                  <div className="flex flex-col gap-2 py-12 text-center">
                    <p className="text-muted-foreground/40 text-sm">
                      No problems match the selected difficulty.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDifficulty("all")}
                      className=""
                    >
                      Clear filter
                    </Button>
                  </div>
                ) : (
                  <m.div className="flex flex-col gap-4">
                    {filteredProblems.map((problem, i) => (
                      <ProblemCard key={problem.id} problem={problem} index={i} />
                    ))}
                  </m.div>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </Anim>
      </PageContainer>
    </div>
  );
}
