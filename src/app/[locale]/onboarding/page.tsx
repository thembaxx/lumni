"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import dynamic from "next/dynamic";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Confetti } from "@/components/celebration/confetti";
import { PageContainer } from "@/components/layout/page-container";
import subjectsData from "@/data/subjects.json";
import { useOnboarding } from "@/hooks/use-onboarding";
import { saveLocalEnrolledSubjects } from "@/hooks/use-subjects";
import { useAuth } from "@/lib/auth/auth-context";
import { iOSEase } from "@/lib/utils/animation";
import { CompleteStep } from "@/components/onboarding/complete-step";
import { GoalsStep } from "@/components/onboarding/goals-step";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { SubjectSelectionStep } from "@/components/onboarding/subject-selection-step";
import { GoalsSVG } from "@/components/onboarding/svgs/goals-svg";
import { SubjectsSVG } from "@/components/onboarding/svgs/subjects-svg";
import { WelcomeSVG } from "@/components/onboarding/svgs/welcome-svg";
import { WizardFooter } from "@/components/onboarding/wizard-footer";

type Subject = (typeof subjectsData)[number];

const ParticleField = dynamic(
  () =>
    import("@/components/onboarding/particle-field").then((m) => ({ default: m.ParticleField })),
  { ssr: false },
);

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

export default function OnboardingPage() {
  const { data, completeOnboarding } = useOnboarding();
  const router = useRouter();
  const [wizard, dispatchWizard] = useReducer(wizardReducer, {
    step: data.currentStep,
    selectedSubjects: data.selectedSubjects,
    targetAps: data.targetAps,
    dailyMinutes: data.dailyStudyMinutes,
  });
  const setStep = (step: number | ((prev: number) => number)) =>
    dispatchWizard({ type: "setStep", step });
  const setSelectedSubjects = (subjects: string[]) =>
    dispatchWizard({ type: "setSelectedSubjects", subjects });
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

  useEffect(() => {
    if (data.isComplete) {
      router.replace("/dashboard");
    }
  }, [data.isComplete, router]);

  const current = STEPS_COPY[step];
  const { user } = useAuth();

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

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const cat of CATEGORY_ORDER) {
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

    completeOnboarding({ selectedSubjects, targetAps, dailyStudyMinutes: dailyMinutes });

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
      router.push("/dashboard");
    }, 800);
  }, [isCompleting, completeOnboarding, selectedSubjects, targetAps, dailyMinutes, user, router]);

  const handleNext = () => {
    if (step === STEPS_COPY.length - 1) {
      complete();
      return;
    }
    if (step === 1) setSearchTerm("");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((prev) => prev - 1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value) {
      setExpandedCategories(() => {
        const all: Record<string, boolean> = {};
        for (const cat of CATEGORY_ORDER) all[cat] = true;
        return all;
      });
    }
  };

  const handleToggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleToggleSubject = (id: string) => {
    setSelectedSubjects(
      selectedSubjects.includes(id)
        ? selectedSubjects.filter((s) => s !== id)
        : [...selectedSubjects, id],
    );
  };

  return (
    <div className="relative z-elevated min-h-dvh bg-system-grouped">
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
                className="font-medium text-primary text-xs underline decoration-primary/30 underline-offset-2 transition-[text-decoration-color] duration-200 hover:decoration-primary"
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
            animate={
              shouldReduceMotion
                ? {}
                : { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: iOSEase } }
            }
            exit={
              shouldReduceMotion
                ? {}
                : { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.18, ease: iOSEase } }
            }
            className="flex-1"
          >
            {step < 3 ? (
              <div className="flex flex-col items-center gap-6 md:grid md:grid-cols-12 md:items-center">
                <div className="flex w-full flex-col items-center text-center md:col-span-6 md:items-start md:text-left">
                  <m.div
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: iOSEase }}
                    className="w-full"
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
                        categoryOrder={CATEGORY_ORDER}
                        categoryLabels={CATEGORY_LABELS}
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

                <div className="hidden items-center justify-center py-8 md:flex md:col-span-6">
                  <m.div
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: iOSEase, delay: 0.08 }}
                    className="flex size-80 items-center justify-center rounded-3xl bg-(--system-accent)/5"
                  >
                    <div className="h-60 w-60">
                      <current.SVG />
                    </div>
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
    </div>
  );
}
