"use client";

import Camera01Icon from "@hugeicons/core-free-icons/Camera01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useOnboarding } from "@/hooks/use-onboarding";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const MATH_SUBJECTS = new Set([
  "mathematics",
  "mathematical-literacy",
  "technical-mathematics",
  "physical-sciences",
]);

export function SnapFab({ inline }: { inline?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isOnboarding } = useOnboarding();
  const { push } = useNavigationDirection();

  const isOnQuizOrFlashcards = pathname.startsWith("/quiz") || pathname.startsWith("/flashcards");
  const isOnExam = pathname.startsWith("/exam/");
  const subjectParam = searchParams.get("subject");
  const isMathSubject = useMemo(
    () => !subjectParam || MATH_SUBJECTS.has(subjectParam),
    [subjectParam],
  );

  const shouldShow = !isOnboarding && (isOnExam || (isOnQuizOrFlashcards && isMathSubject));

  if (!shouldShow) return null;

  return inline ? (
    <button
      type="button"
      onClick={() => push("/solve?camera=1")}
      aria-label="Snap photo to solve"
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--system-accent) text-white shadow-level-2 transition-transform hover:bg-(--system-accent)/90 press-scale"
    >
      <HugeiconsIcon icon={Camera01Icon} className="size-5" />
    </button>
  ) : (
    <Button
      type="button"
      onClick={() => push("/solve?camera=1")}
      aria-label="Snap photo to solve"
      className={cn(
        "fixed right-5 bottom-31 z-toast",
        "flex size-12 items-center justify-center",
        "rounded-full bg-(--system-accent) text-white",
        "shadow-level-3 transition-transform press-scale",
        "hover:bg-(--system-accent)/90",
      )}
    >
      <HugeiconsIcon icon={Camera01Icon} className="size-5" />
    </Button>
  );
}
