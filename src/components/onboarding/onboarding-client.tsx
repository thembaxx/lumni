"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Confetti } from "@/components/celebration/canvas-confetti";
import { SpotlightCard } from "@/components/shared/motion-primitives";
import { PageContainer } from "@/components/layout/page-container";
import rawSubjects from "@/data/subjects.json";
import { useOnboarding } from "@/hooks/use-onboarding";
import { saveLocalEnrolledSubjects } from "@/hooks/use-subjects";
import { iOSEase } from "@/lib/utils/animation";
import { springPresets } from "@/lib/utils/spring-presets";
import { CompleteStep } from "@/components/onboarding/complete-step";
import { GoalsStep } from "@/components/onboarding/goals-step";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { SubjectSelectionStep } from "@/components/onboarding/subject-selection-step";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/subjects/categories";
import { GoalsSVG } from "@/components/onboarding/svgs/goals-svg";
import { SubjectsSVG } from "@/components/onboarding/svgs/subjects-svg";

interface Subject {
  id: string;
  name: string;
  color: string;
  category?: string;
}

function mapSubject(s: {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  category: string;
  color: string;
}): Subject {
  return { id: s.id, name: s.name, color: s.color, category: s.category };
}

const MAX_STEPS = 4;

export default function OnboardingClient() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const initialized = useRef(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: onboardingData, completeOnboarding } = useOnboarding();
  const hasCompleted = onboardingData.isComplete;

  const subjects = useMemo(() => rawSubjects.map(mapSubject), []);

  const subjectsByCategory = useMemo(() => {
    const map: Record<string, Subject[]> = {};
    for (const s of subjects) {
      const cat = s.category || "other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    }
    return map;
  }, [subjects]);

  const categoryOrder = useMemo(
    () => CATEGORY_ORDER.filter((c) => subjectsByCategory[c]),
    [subjectsByCategory],
  );

  const [step, setStep] = useState(0);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [targetAps, setTargetAps] = useState(25);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [isComplete, setIsComplete] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return null;
    const q = searchTerm.toLowerCase();
    return subjects.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q),
    );
  }, [searchTerm, subjects]);

  const handleToggleSubject = useCallback((id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleToggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (hasCompleted) {
      router.replace("/dashboard");
    }
  }, [hasCompleted, router]);

  const handleContinue = useCallback(() => {
    if (step < MAX_STEPS - 1) {
      setStep((s) => s + 1);
    }
    if (step === MAX_STEPS - 1) {
      setSubmitted(true);
      saveLocalEnrolledSubjects(selectedSubjects);
      completeOnboarding({});
      setIsComplete(true);
      setTimeout(() => router.replace("/dashboard"), 1200);
    }
  }, [step, selectedSubjects, completeOnboarding, router]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isComplete ? (
        <m.div
          key="onboarding-complete"
          className="flex min-h-dvh flex-col items-center justify-center gap-8"
        >
          <Confetti trigger />
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: iOSEase }}
          >
            <CompleteStep
              selectedSubjects={selectedSubjects}
              subjectsData={subjects}
              title="You're all set!"
              body="Your learning journey begins now."
            />
          </m.div>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="flex items-center gap-2 text-muted-foreground text-xs"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-(--system-accent)" />
            Taking you to your dashboard
          </m.div>
        </m.div>
      ) : (
        <m.div
          key="onboarding-form"
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={springPresets.fast}
        >
          <PageContainer>
            <SpotlightCard radius={300}>
              <div className="flex flex-col items-center justify-center py-8">
                <m.div
                  className="flex w-full max-w-md flex-col gap-8"
                  initial={false}
                  animate={{ opacity: 1 }}
                >
                  <StepIndicator
                    step={step}
                    totalSteps={MAX_STEPS}
                    labels={["Subjects", "Goals", "Favourites", "Review"]}
                  />

                  <AnimatePresence mode="wait" initial={false}>
                    <m.div
                      key={step}
                      className="flex flex-col gap-8"
                      {...(shouldReduceMotion
                        ? {}
                        : {
                            initial: { opacity: 0, x: 20 },
                            animate: { opacity: 1, x: 0 },
                            exit: { opacity: 0, x: -20 },
                            transition: { duration: 0.4, ease: iOSEase },
                          })}
                    >
                      {step === 0 && (
                        <div className="flex flex-col items-center gap-6">
                          <SubjectsSVG />
                          <div className="flex flex-col gap-2 text-center">
                            <h1 className="font-heading font-semibold text-2xl">
                              What subjects are you taking?
                            </h1>
                            <p className="text-muted-foreground text-sm">
                              Choose the subjects you&apos;ll be studying this year.
                            </p>
                          </div>
                          <SubjectSelectionStep
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            expandedCategories={expandedCategories}
                            onToggleCategory={handleToggleCategory}
                            selectedSubjects={selectedSubjects}
                            onToggleSubject={handleToggleSubject}
                            filteredSubjects={filteredSubjects}
                            subjectsByCategory={subjectsByCategory}
                            categoryOrder={categoryOrder}
                            categoryLabels={CATEGORY_LABELS}
                          />
                        </div>
                      )}

                      {step === 1 && (
                        <div className="flex flex-col items-center gap-6">
                          <GoalsSVG />
                          <div className="flex flex-col gap-2 text-center">
                            <h1 className="font-heading font-semibold text-2xl">
                              What are your learning goals?
                            </h1>
                            <p className="text-muted-foreground text-sm">
                              Set your targets to help us personalise your experience.
                            </p>
                          </div>
                          <GoalsStep
                            targetAps={targetAps}
                            dailyMinutes={dailyMinutes}
                            onTargetApsChange={setTargetAps}
                            onDailyMinutesChange={setDailyMinutes}
                          />
                        </div>
                      )}

                      {step === 2 && (
                        <div className="flex flex-col items-center gap-6">
                          <SubjectsSVG />
                          <div className="flex flex-col gap-2 text-center">
                            <h1 className="font-heading font-semibold text-2xl">
                              Pick your favourites
                            </h1>
                            <p className="text-muted-foreground text-sm">
                              From your enrolled subjects, choose up to 3 favourites for quick
                              access on your dashboard.
                            </p>
                          </div>
                          <SubjectSelectionStep
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            expandedCategories={expandedCategories}
                            onToggleCategory={handleToggleCategory}
                            selectedSubjects={selectedSubjects}
                            onToggleSubject={(id) => {
                              if (selectedSubjects.includes(id)) {
                                setSelectedSubjects((prev) => prev.filter((x) => x !== id));
                              } else if (selectedSubjects.length < 3) {
                                setSelectedSubjects((prev) => [...prev, id]);
                              }
                            }}
                            filteredSubjects={filteredSubjects}
                            subjectsByCategory={subjectsByCategory}
                            categoryOrder={categoryOrder}
                            categoryLabels={CATEGORY_LABELS}
                          />
                        </div>
                      )}

                      {step === 3 && (
                        <CompleteStep
                          selectedSubjects={selectedSubjects}
                          subjectsData={subjects}
                          title="Ready to start?"
                          body={`${selectedSubjects.length} subject${selectedSubjects.length === 1 ? "" : "s"} selected`}
                        />
                      )}
                    </m.div>
                  </AnimatePresence>

                  <div className="mt-4 flex items-center justify-between">
                    {step > 0 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                      >
                        Back
                      </button>
                    )}
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={handleContinue}
                      disabled={submitted || (step === 0 && selectedSubjects.length === 0)}
                      className="rounded-lg bg-system-accent px-6 py-2 text-sm font-semibold text-system-accent-foreground transition-[background-color,opacity] hover:bg-system-accent/90 disabled:opacity-50"
                    >
                      {step === MAX_STEPS - 1 ? "Get Started" : "Continue"}
                    </button>
                  </div>
                </m.div>
              </div>
            </SpotlightCard>
          </PageContainer>
        </m.div>
      )}
    </AnimatePresence>
  );
}
