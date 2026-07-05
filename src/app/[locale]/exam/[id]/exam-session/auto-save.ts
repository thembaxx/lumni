"use client";

import { useExamSessionAutoSave } from "@/hooks/use-exam-session-persistence";
import { useExamSessionSync } from "@/hooks/use-exam-session-sync";

export function useAutoSave(id: string) {
  useExamSessionSync();
  useExamSessionAutoSave(id);
}
