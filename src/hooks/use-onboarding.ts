"use client";

import { useCallback, useState } from "react";
import { dexieDataAccess } from "@/lib/db";
import type { SyncDataAccess } from "@/lib/db/data-access";

let _deps: { db: SyncDataAccess } = { db: dexieDataAccess };
function __setDepsForTesting(deps: { db: SyncDataAccess }) {
  _deps = deps;
}

export interface OnboardingData {
  isComplete: boolean;
  startedAt?: number;
  completedAt?: number;
  selectedSubjects: string[];
  targetAps: number;
  dailyStudyMinutes: number;
  studyTimes: number[];
  notificationsEnabled: boolean;
  currentStep: number;
  notificationFrequency: "daily" | "every_other_day" | "weekly";
  notificationTimeOfDay: "morning" | "afternoon" | "evening" | undefined;
}

export interface UseOnboardingReturn {
  isOnboarding: boolean;
  data: OnboardingData;
  startOnboarding: () => void;
  completeOnboarding: (data: Partial<OnboardingData>) => void;
  skipOnboarding: () => void;
  updateProgress: (data: Partial<OnboardingData>) => void;
  resetOnboarding: () => void;
}

const STORAGE_KEY = "lumni_onboarding";

const DEFAULT_ONBOARDING: OnboardingData = {
  isComplete: false,
  selectedSubjects: [],
  targetAps: 30,
  dailyStudyMinutes: 30,
  studyTimes: [18, 19, 20],
  notificationsEnabled: false,
  currentStep: 0,
  notificationFrequency: "daily",
  notificationTimeOfDay: "morning",
};

function loadLocal(): OnboardingData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_ONBOARDING, ...JSON.parse(raw) };
  } catch {
    // localStorage unavailable
  }
  return { ...DEFAULT_ONBOARDING };
}

function saveLocal(data: OnboardingData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

export function useOnboarding(): UseOnboardingReturn {
  const [data, setData] = useState<OnboardingData>(loadLocal);

  const isOnboarding = !data.isComplete;

  const startOnboarding = useCallback(() => {
    setData((prev) => ({
      ...prev,
      isComplete: false,
      startedAt: Date.now(),
      currentStep: 0,
      notificationFrequency: DEFAULT_ONBOARDING.notificationFrequency,
      notificationTimeOfDay: DEFAULT_ONBOARDING.notificationTimeOfDay,
    }));
  }, []);

  const completeOnboarding = useCallback((newData: Partial<OnboardingData>) => {
    setData((prev) => {
      const updated = {
        ...prev,
        ...newData,
        isComplete: true,
        completedAt: Date.now(),
      };
      saveLocal(updated);
      return updated;
    });
  }, []);

  const skipOnboarding = useCallback(() => {
    setData((prev) => {
      const updated = { ...prev, isComplete: true, completedAt: Date.now() };
      saveLocal(updated);
      return updated;
    });
  }, []);

  const updateProgress = useCallback((newData: Partial<OnboardingData>) => {
    setData((prev) => {
      const updated = { ...prev, ...newData };
      saveLocal(updated);
      return updated;
    });
  }, []);

  const resetOnboarding = useCallback(() => {
    const fresh = { ...DEFAULT_ONBOARDING };
    saveLocal(fresh);
    setData(fresh);
  }, []);

  return {
    isOnboarding,
    data,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    updateProgress,
    resetOnboarding,
  };
}
