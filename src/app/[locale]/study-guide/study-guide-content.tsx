"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import BookOpen02Icon from "@hugeicons/core-free-icons/BookOpen02Icon";
import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { FadeIn } from "@/components/shared/fade-in";
import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Anim } from "@/components/shared/anim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SubjectSelect } from "@/components/ui/subject-select";
import { useStudyGuide } from "@/hooks/use-study-guide";
import { useRouter } from "@/i18n/navigation";
import type { StudyGuide } from "@/lib/study-guide/types";

function StudyGuideContent({ guide }: { guide: StudyGuide }) {
  return (
    <div className="flex flex-col gap-6">
      {guide.sections.map((section, i) => (
        <FadeIn
          key={section.title}
          direction="up"
          distance={12}
          duration={0.3}
          delay={i * 0.08}
          className="overflow-hidden rounded-card border border-border bg-card shadow-level-2"
        >
          <div className="flex flex-col gap-4 p-6">
            <h2 className="font-semibold text-foreground text-xl tracking-tight">
              {section.title}
            </h2>
            <div className="text-foreground/80 text-sm leading-relaxed">
              <MarkdownRenderer content={section.content} />
            </div>
            {section.keyPoints.length > 0 && (
              <div className="flex flex-col gap-2 rounded-xl bg-system-background p-4">
                <p className="font-semibold text-muted-foreground text-xs uppercase">Key Points</p>
                <ul className="flex flex-col gap-1.5">
                  {section.keyPoints.map((point) => (
                    <li
                      key={point}
                      className="overflow-wrap-anywhere flex items-start gap-2 text-foreground/70 text-sm"
                    >
                      <span className="mt-0.5 block size-1.5 shrink-0 rounded-full bg-foreground/30" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </FadeIn>
      ))}

      {guide.summary && (
        <FadeIn
          distance={0}
          delay={guide.sections.length * 0.08 + 0.1}
          className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-primary/5 p-6"
        >
          <p className="font-semibold text-muted-foreground text-xs uppercase">Summary</p>
          <p className="overflow-wrap-anywhere text-foreground/70 text-sm leading-relaxed">
            {guide.summary}
          </p>
        </FadeIn>
      )}
    </div>
  );
}

function StudyGuideClient() {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topicText, setTopicText] = useState("");
  const { data, isPending, error, mutate } = useStudyGuide();
  const [fetched, setFetched] = useState(false);
  const router = useRouter();

  const handleGenerate = () => {
    if (!selectedSubject || !topicText.trim()) return;
    setFetched(true);
    mutate({ subject: selectedSubject, topic: topicText.trim() });
  };

  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient />
      <PageContainer className="flex flex-col gap-8">
        <Anim>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="ios-title-1 font-bold text-foreground tracking-tight">Study Guide</h1>
              <p className="ios-subhead text-muted-foreground/60">
                Generate AI-powered study guides for any subject and topic
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SubjectSelect value={selectedSubject} onChange={setSelectedSubject} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    value={topicText}
                    onChange={(e) => setTopicText(e.target.value)}
                    placeholder="Enter topic (e.g. Quadratic Equations, Cellular Respiration)"
                    aria-label="Topic"
                    className="h-11 rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedSubject || !topicText.trim() || isPending}
                  className="h-11 shrink-0 gap-2 rounded-xl"
                >
                  {isPending && (
                    <HugeiconsIcon icon={RadialIcon} className="size-4 animate-spin" data-icon />
                  )}
                  Generate Guide
                </Button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {!fetched && !isPending && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-20 text-center"
              >
                <HugeiconsIcon
                  icon={BookOpen01Icon}
                  className="mx-auto mb-4 size-12 text-muted-foreground/20"
                />
                <p className="text-muted-foreground/40 text-sm">
                  Select a subject and topic to generate a study guide
                </p>
              </m.div>
            )}

            {isPending && (
              <m.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={`skeleton-${i}`} className="flex flex-col gap-3 rounded-2xl p-6">
                    <div className="h-5 w-1/3 rounded bg-muted/30" />
                    <div className="h-4 w-full rounded bg-muted/30" />
                    <div className="h-4 w-3/4 rounded bg-muted/30" />
                    <div className="h-4 w-1/2 rounded bg-muted/30" />
                  </Skeleton>
                ))}
              </m.div>
            )}

            {error && (
              <m.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm"
              >
                Failed to generate study guide. Please try again.
              </m.div>
            )}

            {data && !isPending && !error && (
              <m.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4"
              >
                <StudyGuideContent guide={data} />
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() =>
                      router.push(
                        `/quiz?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(topicText)}&count=10`,
                      )
                    }
                    className="h-10 gap-2 rounded-xl"
                  >
                    <HugeiconsIcon icon={BookOpen02Icon} className="size-4" data-icon />
                    Practice these topics
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/flashcards?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(topicText)}`,
                      )
                    }
                    className="h-10 gap-2 rounded-xl"
                  >
                    <HugeiconsIcon icon={BookOpen01Icon} className="size-4" data-icon />
                    Generate flashcards
                  </Button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </Anim>
      </PageContainer>
    </div>
  );
}

export default function StudyGuidePage() {
  return <StudyGuideClient />;
}
