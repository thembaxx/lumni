"use client";

import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import BatteryFullIcon from "@hugeicons/core-free-icons/BatteryFullIcon";
import BookOpen02Icon from "@hugeicons/core-free-icons/BookOpen02Icon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import ChartBarBigIcon from "@hugeicons/core-free-icons/ChartBarBigIcon";
import ChartLineData01Icon from "@hugeicons/core-free-icons/ChartLineData01Icon";
import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import GoldIcon from "@hugeicons/core-free-icons/GoldIcon";
import Login01Icon from "@hugeicons/core-free-icons/Login01Icon";
import Presentation01Icon from "@hugeicons/core-free-icons/Presentation01Icon";
import StarCircleIcon from "@hugeicons/core-free-icons/StarCircleIcon";
import UserMultipleIcon from "@hugeicons/core-free-icons/UserMultipleIcon";
import UserStar02Icon from "@hugeicons/core-free-icons/UserStar02Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useAuth } from "@/lib/auth/auth-context";

const DISMISS_KEY = "lumni_login_banner_dismissed";

interface LockedFeature {
  icon: typeof StarCircleIcon;
  title: string;
  description: string;
}

const LOCKED_FEATURES: LockedFeature[] = [
  {
    icon: FireIcon,
    title: "Study Streaks",
    description: "Build daily consistency and track your longest streak",
  },
  {
    icon: GoldIcon,
    title: "Smart Study Plan",
    description: "AI-generated weekly plan tailored to your goals and pace",
  },
  {
    icon: BookOpen02Icon,
    title: "My Assignments",
    description: "View and complete teacher-assigned work in one place",
  },
  {
    icon: ChartBarBigIcon,
    title: "Competency Overview",
    description: "See your strengths and weaknesses across every topic",
  },
  {
    icon: ChartLineData01Icon,
    title: "Mastery Heatmap",
    description: "Visualise your progress at a glance with colour-coded levels",
  },
  {
    icon: StarCircleIcon,
    title: "Daily Challenges",
    description: "Earn bonus XP with short, focused challenge exercises",
  },
  {
    icon: UserMultipleIcon,
    title: "Social Leaderboard",
    description: "Compete with friends and see where you rank weekly",
  },
  {
    icon: Award01Icon,
    title: "Achievement Showcase",
    description: "Collect badges as you level up in each subject",
  },
  {
    icon: BatteryFullIcon,
    title: "Reward Chest",
    description: "Unlock rewards by staying active",
  },
  {
    icon: Presentation01Icon,
    title: "Comparative Analytics",
    description: "See how you compare with peers across subjects",
  },
  {
    icon: UserStar02Icon,
    title: "Knowledge Map",
    description: "Explore how topics connect and what to study next",
  },
];

function FeatureDialog() {
  const [open, setOpen] = useState(false);
  const { push } = useNavigationDirection();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2.5 text-xs"
        onClick={() => setOpen(true)}
      >
        See Features
      </Button>
      <DialogContent className="flex flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Features waiting for you</DialogTitle>
          <DialogDescription>Log in to unlock your full study toolkit</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[50dvh] flex-col gap-1 overflow-y-auto py-2">
          {LOCKED_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-system-accent/10">
                <HugeiconsIcon icon={feature.icon} className="size-4 text-system-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{feature.title}</p>
                <p className="text-muted-foreground text-xs">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-1">
          <Button
            className="h-10 w-full gap-2 text-sm"
            onClick={() => {
              push("/auth/sign-in?redirect=/dashboard");
            }}
          >
            <HugeiconsIcon icon={Login01Icon} className="size-4" />
            Log In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LoginBanner() {
  const { user, isAnonymous } = useAuth();
  const { push } = useNavigationDirection();
  const isLoggedIn = !!user && !isAnonymous;

  const [localDismissed, setLocalDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(DISMISS_KEY) === "true";
  });

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "true");
    setLocalDismissed(true);
  }, []);

  if (isLoggedIn || localDismissed) return null;

  return (
    <div className="card-entrance-down flex w-full items-center gap-3 rounded-xl border border-system-accent/15 bg-system-accent/8 px-3 py-2 sm:px-4 sm:py-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-system-accent/15">
        <HugeiconsIcon icon={Login01Icon} className="size-3.5 text-system-accent" />
      </div>
      <p className="min-w-0 flex-1 truncate text-balance font-semibold text-sm">
        Log in to unlock your full study toolkit
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="sm"
          variant="default"
          className="h-7 px-2.5 text-xs"
          onClick={() => {
            push("/auth/sign-in?redirect=/dashboard");
          }}
        >
          Log In
        </Button>
        <FeatureDialog />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDismiss}
          className="-mr-1 size-7"
          aria-label="Dismiss"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
