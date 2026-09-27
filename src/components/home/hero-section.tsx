"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { Link } from "@/i18n/navigation";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

export const HeroSection = memo(function HeroSection({
  isAuthenticated: _isAuthenticated,
}: HeroSectionProps) {
  return (
    <section
      id="main-content"
      className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 md:pt-16 md:pb-24"
    >
      {/* Hero Top Grid: Copy left, visual right */}
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Left Copy Column */}
        <div className="flex flex-col items-start lg:col-span-7">
          {/* Green color-block badge */}
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-block size-3 bg-[var(--accent-green)]" aria-hidden="true" />
            <span className="font-body font-bold text-xs uppercase tracking-wider text-[var(--accent-green)]">
              <span className="hidden sm:inline">PROUDLY SOUTH AFRICAN</span>
              <span className="sm:hidden">PROUDLY SA</span>
            </span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-[var(--fg)] leading-[1.05]">
            Your Matric.
            <br />
            Your mark.
          </h1>

          <p className="mt-5 max-w-lg font-body text-base md:text-lg text-[var(--fg-muted)] leading-relaxed">
            Quizzes, flashcards, real past papers and a planner built for how South African students
            actually study.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
              <Link href="/dashboard">Start free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <a href="#features">See how it works</a>
            </Button>
          </div>
        </div>

        {/* Right Side Visual Block */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Top row: Green and Gold blocks */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 sm:h-28 rounded-lg bg-[var(--accent-green)]" />
            <div className="h-24 sm:h-28 rounded-lg bg-[var(--accent-gold)]" />
          </div>

          {/* Middle hero card: Outlined Newton's Laws Card */}
          <Card variant="hero" className="flex flex-col justify-center">
            <span className="font-body font-bold text-[11px] uppercase tracking-wider text-[var(--accent-red)]">
              PHYSICAL SCIENCES
            </span>
            <h3 className="mt-1 font-display font-bold text-base sm:text-lg text-[var(--fg)]">
              Newton&apos;s Laws — Quiz 3
            </h3>
            <div className="mt-3">
              <Progress value={65}>
                <ProgressTrack className="h-2 bg-[var(--border-soft)]">
                  <ProgressIndicator className="bg-[var(--accent-green)]" />
                </ProgressTrack>
              </Progress>
            </div>
          </Card>

          {/* Bottom row: Solid black block and Attention highlight card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
            <div className="h-20 sm:h-auto rounded-lg bg-[var(--fg)] sm:col-span-1" />
            <div className="flex items-center justify-center rounded-lg bg-[var(--highlight-bg)] p-4 sm:col-span-2">
              <span className="font-body font-semibold text-xs sm:text-sm text-[var(--highlight-fg)]">
                Flashcards due today
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Summaries Row */}
      <div id="features" className="mt-16 sm:mt-24 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card variant="flat">
          <CardHeader>
            <CardTitle>Smart quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Adjusts to what you keep getting wrong.</CardDescription>
          </CardContent>
        </Card>

        <Card variant="flat">
          <CardHeader>
            <CardTitle>Flashcards</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Spaced repetition, from your syllabus.</CardDescription>
          </CardContent>
        </Card>

        <Card variant="flat">
          <CardHeader>
            <CardTitle>Past papers</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Every NSC paper, marked line by line.</CardDescription>
          </CardContent>
        </Card>
      </div>
    </section>
  );
});
