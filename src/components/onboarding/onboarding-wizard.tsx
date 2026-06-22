"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Confetti } from "@/components/celebration/confetti";
import { PageContainer } from "@/components/layout/page-container";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import subjectsData from "@/data/subjects.json";
import { useOnboarding } from "@/hooks/use-onboarding";
import { saveLocalEnrolledSubjects } from "@/hooks/use-subjects";
import { useAuth } from "@/lib/auth/auth-context";
import { iOSEase } from "@/lib/utils/animation";
import { CompleteStep } from "./complete-step";
import { GoalsStep } from "./goals-step";
import { StepIndicator } from "./step-indicator";
import { SubjectSelectionStep } from "./subject-selection-step";
import { GoalsSVG } from "./svgs/goals-svg";
import { SubjectsSVG } from "./svgs/subjects-svg";
import { WelcomeSVG } from "./svgs/welcome-svg";
import { WizardFooter } from "./wizard-footer";

type Subject = (typeof subjectsData)[number];

const ParticleField = dynamic(
  () => import("./particle-field").then((m) => ({ default: m.ParticleField })),
  { ssr: false },
);

interface OnboardingWizardProps {
  onComplete?: () => void;
}

const STEPS_COPY = [
  {
    title: "Pass your Matric with confidence",
    body: "Lumni tailors quizzes, flashcards, and past papers to your subjects. Get set up in 30 seconds.",
    cta: "Let's go",
    SVG: WelcomeSVG,
  },
  {
    title: "Pick your subjects",
    body: "Select the subjects you're taking this year so everything is relevant from day one.",
    cta: "Continue",
    SVG: SubjectsSVG,
  },
  {
    title: "Set your goals",
    body: "Your target APS and how much time you can study each day. We'll build a plan around it.",
    cta: "Continue",
    SVG: GoalsSVG,
  },
  {
    title: "You're all set",
    body: "Your preferences are saved. Ready to answer your first question?",
    cta: "Start learning",
    SVG: WelcomeSVG,
  },
] as const;

type WizardState = {
  step: number;
  selectedSubjects: string[];
  targetAps: number;
  dailyMinutes: number;
};

type WizardAction =
  | { type: "setStep"; step: number | ((prev: number) => number) }
  | { type: "setSelectedSubjects"; subjects: string[] }
  | { type: "setTargetAps"; aps: number }
  | { type: "setDailyMinutes"; minutes: number };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "setStep":
      return {
        ...state,
        step: typeof action.step === "function" ? action.step(state.step) : action.step,
      };
    case "setSelectedSubjects":
      return { ...state, selectedSubjects: action.subjects };
    case "setTargetAps":
      return { ...state, targetAps: action.aps };
    case "setDailyMinutes":
      return { ...state, dailyMinutes: action.minutes };
    default:
      return state;
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  sciences: "Sciences",
  languages: "Languages",
  business: "Business",
  humanities: "Humanities",
  technology: "Technology",
  agriculture: "Agriculture",
  arts: "Arts",
  services: "Services",
  compulsory: "Compulsory",
};

const CATEGORY_ORDER: string[] = [
  "sciences",
  "languages",
  "business",
  "humanities",
  "technology",
  "agriculture",
  "arts",
  "services",
  "compulsory",
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { data, completeOnboarding } = useOnboarding();
  const [wizard, dispatchWizard] = useReducer(wizardReducer, {
    step: data.currentStep,
    selectedSubjects: data.selectedSubjects,
    targetAps: data.targetAps,
    dailyMinutes: data.dailyStudyMinutes,
  });
  const setStep = (step: number | ((prev: number) => number)) =>
    dispatchWizard({ type: "setStep", step });
  const setSelectedSubjects = (subjects: string[]) =>
    dispatchWizard({
      type: "setSelectedSubjects",
      subjects: subjects as readonly string[] as string[],
    });
  const setTargetAps = (aps: number) => dispatchWizard({ type: "setTargetAps", aps });
  const setDailyMinutes = (minutes: number) => dispatchWizard({ type: "setDailyMinutes", minutes });
  const { step, selectedSubjects, targetAps, dailyMinutes } = wizard;
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timerAtMount = completeTimerRef.current;
    return () => {
      if (timerAtMount) clearTimeout(timerAtMount);
    };
  }, []);

  const current = STEPS_COPY[step];
  const { user } = useAuth();

  const categoryLabels: Record<string, string> = CATEGORY_LABELS;

  const subjectsByCategory = useMemo(() => {
    const groups: Record<string, Subject[]> = {};
    for (const subject of subjectsData) {
      const cat = subject.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(subject);
    }
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
  }, []);

  const categoryOrder = CATEGORY_ORDER;

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const cat of categoryOrder) {
      initial[cat] = false;
    }
    initial.sciences = true;
    return initial;
  });

  const filteredSubjects = searchTerm
    ? subjectsData.filter((subject) =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : null;

  const canProceed = () => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return selectedSubjects.length > 0;
      case 2:
        return targetAps >= 20 && targetAps <= 50 && dailyMinutes >= 10;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const complete = useCallback(async () => {
    if (isCompleting) return;
    setIsCompleting(true);

    completeOnboarding({
      selectedSubjects,
      targetAps,
      dailyStudyMinutes: dailyMinutes,
    });

    if (user) {
      try {
        await fetch("/api/subjects/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectIds: selectedSubjects }),
        });
      } catch (e) {
        console.warn("[Onboarding] Failed to enroll subjects", e);
      }
    } else {
      saveLocalEnrolledSubjects(selectedSubjects);
    }

    setShowConfetti(true);
    completeTimerRef.current = setTimeout(() => {
      onComplete?.();
    }, 800);
  }, [
    isCompleting,
    completeOnboarding,
    selectedSubjects,
    targetAps,
    dailyMinutes,
    onComplete,
    user,
  ]);

  const handleNext = () => {
    if (step === STEPS_COPY.length - 1) {
      complete();
      return;
    }
    if (step === 1) setSearchTerm("");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value) {
      setExpandedCategories(() => {
        const all: Record<string, boolean> = {};
        for (const cat of categoryOrder) {
          all[cat] = true;
        }
        return all;
      });
    }
  };

  const handleToggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleToggleSubject = (id: string) => {
    setSelectedSubjects(
      selectedSubjects.includes(id)
        ? selectedSubjects.filter((s) => s !== id)
        : [...selectedSubjects, id],
    );
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      {/* Intentionally non-dismissable — forced onboarding flow. Escape is disabled
			    because the user must complete onboarding before accessing the dashboard. */}
      <DialogContent
        showCloseButton={false}
        className="inset-0 m-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0 bg-system-grouped p-0"
      >
        <DialogTitle className="sr-only">Onboarding</DialogTitle>
        {showConfetti && <Confetti trigger={showConfetti} />}
        <ParticleField step={step} />

        <PageContainer className="relative z-elevated min-h-full py-4 md:py-8">
          <div className="mb-2 flex items-center justify-between">
            <StepIndicator step={step} totalSteps={STEPS_COPY.length} />
            <div className="ml-4 flex shrink-0 items-center gap-3">
              <span className="font-medium text-muted-foreground text-xs tabular-nums">
                Step {step + 1} of {STEPS_COPY.length}
              </span>
              {step < STEPS_COPY.length - 1 && (
                <button
                  type="button"
                  onClick={complete}
                  className="font-medium text-primary text-xs underline decoration-primary/30 underline-offset-2 transition-all hover:decoration-primary"
                >
                  Skip to dashboard
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={`step-${step}`}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.35, ease: iOSEase }}
              className="flex-1"
            >
              {step < 3 ? (
                <div className="grid grid-cols-12 items-center gap-6">
                  <div className="col-span-12 md:col-span-6">
                    <m.div
                      initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: iOSEase }}
                    >
                      <h1 className="ios-title-1 mb-3 text-balance font-semibold tracking-tight">
                        {current.title}
                      </h1>
                      <p className="ios-body mb-8 text-pretty text-muted-foreground leading-relaxed">
                        {current.body}
                      </p>

                      {step === 1 && (
                        <SubjectSelectionStep
                          searchTerm={searchTerm}
                          onSearchChange={handleSearchChange}
                          expandedCategories={expandedCategories}
                          onToggleCategory={handleToggleCategory}
                          selectedSubjects={selectedSubjects}
                          onToggleSubject={handleToggleSubject}
                          filteredSubjects={filteredSubjects}
                          subjectsByCategory={subjectsByCategory}
                          categoryOrder={categoryOrder}
                          categoryLabels={categoryLabels}
                        />
                      )}

                      {step === 2 && (
                        <GoalsStep
                          targetAps={targetAps}
                          dailyMinutes={dailyMinutes}
                          onTargetApsChange={setTargetAps}
                          onDailyMinutesChange={setDailyMinutes}
                        />
                      )}
                    </m.div>
                  </div>

                  <div className="col-span-12 flex items-center justify-center py-8 md:col-span-6">
                    <m.div
                      initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: iOSEase, delay: 0.08 }}
                      className="h-56 w-56 md:h-64 md:w-64"
                    >
                      <current.SVG />
                    </m.div>
                  </div>
                </div>
              ) : (
                <CompleteStep
                  selectedSubjects={selectedSubjects}
                  subjectsData={subjectsData}
                  title={current.title}
                  body={current.body}
                />
              )}
            </m.div>
          </AnimatePresence>

          <WizardFooter
            step={step}
            totalSteps={STEPS_COPY.length}
            canProceed={canProceed()}
            isCompleting={isCompleting}
            onBack={handleBack}
            onNext={handleNext}
            onSkip={complete}
            ctaLabel={current.cta}
          />
        </PageContainer>
      </DialogContent>
    </Dialog>
  );
}
