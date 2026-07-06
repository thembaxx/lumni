"use client";

import HeadphonesIcon from "@hugeicons/core-free-icons/HeadphonesIcon";
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import Message01Icon from "@hugeicons/core-free-icons/Message01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
import { motionEase } from "@/lib/utils/animation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SUPPORT_CHANNELS = [
  {
    icon: Mail01Icon,
    label: "Email Support",
    priority: "Get back to you within 4 hours",
    action: "mailto:support@lumni.app",
  },
  {
    icon: Message01Icon,
    label: "In-App Chat",
    priority: "Priority queue, instant response",
    action: "/chat",
  },
  {
    icon: HeadphonesIcon,
    label: "Knowledge Base",
    priority: "Available to all users",
    action: "https://help.lumni.app",
  },
];

export function SupportClient() {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient />
      <PageContainer className="flex flex-col gap-6">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: motionEase }}
        >
          <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">Support</h1>
          <p className="text-muted-foreground text-sm">
            We&apos;re here to help. Get back to you within 4 hours.
          </p>
        </m.div>

        <div className="flex flex-col gap-4">
          {SUPPORT_CHANNELS.map((channel) => (
            <a
              key={channel.label}
              href={channel.action}
              aria-label={`${channel.label} — ${channel.priority}`}
            >
              <Card className="transition-colors hover:bg-accent/5 focus-visible:ring-2 focus-visible:ring-primary">
                <CardHeader className="flex flex-row items-center gap-3">
                  <HugeiconsIcon icon={channel.icon} className="size-5 text-(--system-accent)" />
                  <CardTitle className="font-medium text-base">{channel.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{channel.priority}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
