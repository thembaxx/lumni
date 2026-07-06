"use client";

import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import * as m from "motion/react-m";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
import { motionEase } from "@/lib/utils/animation";
import { HugeiconsIcon } from "@hugeicons/react";
import Chat01Icon from "@hugeicons/core-free-icons/Chat01Icon";
import CompassIcon from "@hugeicons/core-free-icons/CompassIcon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import Upload01Icon from "@hugeicons/core-free-icons/Upload01Icon";
import Share07Icon from "@hugeicons/core-free-icons/Share07Icon";

const toolsItems = [
  { icon: Chat01Icon, label: "Chat", route: "/chat", desc: "AI tutor chat" },
  { icon: CompassIcon, label: "Solve", route: "/solve", desc: "Solve problems step-by-step" },
  {
    icon: BookOpen01Icon,
    label: "Study Guide",
    route: "/study-guide",
    desc: "Generate study guides",
  },
  { icon: Search01Icon, label: "Dictionary", route: "/dictionary", desc: "Look up words" },
  { icon: Search01Icon, label: "Search", route: "/search", desc: "Search everything" },
  { icon: Upload01Icon, label: "Upload", route: "/upload", desc: "Upload files" },
  { icon: Share07Icon, label: "Referral", route: "/settings/referral", desc: "Invite friends" },
];

export function ToolsPageClient() {
  const { push } = useNavigationDirection();

  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient />
      <PageContainer className="flex flex-col gap-6">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: motionEase }}
        >
          <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">Tools</h1>
          <p className="text-muted-foreground text-sm">Learning tools and utilities</p>
        </m.div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {toolsItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => push(item.route)}
              className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 text-left transition-colors hover:bg-accent/5 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--system-accent)/10">
                <HugeiconsIcon icon={item.icon} className="size-5 text-(--system-accent)" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-semibold text-sm text-foreground">{item.label}</span>
                <span className="text-muted-foreground text-xs">{item.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
