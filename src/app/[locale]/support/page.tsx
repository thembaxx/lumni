"use client";

import HeadphonesIcon from "@hugeicons/core-free-icons/HeadphonesIcon";
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import Message01Icon from "@hugeicons/core-free-icons/Message01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { PageContainer } from "@/components/layout/page-container";
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

export default function SupportPage() {
  return (
    <PageContainer className="flex min-h-dvh flex-col gap-6 bg-background py-6">
      <div>
        <h1 className="font-extrabold text-2xl">Support</h1>
        <p className="mt-1 text-muted-foreground/60 text-sm">
          We're here to help. Get back to you within 4 hours.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {SUPPORT_CHANNELS.map((channel) => (
          <a
            key={channel.label}
            href={channel.action}
            aria-label={`${channel.label} — ${channel.priority}`}
          >
            <Card className="transition-colors hover:bg-accent/5">
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
  );
}
