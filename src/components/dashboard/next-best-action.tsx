"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import GraduationCapIcon from "@hugeicons/core-free-icons/GraduationCapIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { dismissAction, resolveNextAction } from "@/lib/retention-loop/next-action";

export function NextBestActionCard() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const { data: action } = useQuery({
    queryKey: ["next-best-action", user?.$id],
    queryFn: async ({ queryKey }) => {
      const [, userId] = queryKey;
      if (!userId) return null;
      return resolveNextAction(userId as string);
    },
    enabled: !!user?.$id,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  if (!action || dismissed) return null;

  return (
    <Card className="relative rounded-[20px] border border-accent-green/20 bg-accent-green/5 shadow-level-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          dismissAction(action.kind);
          setDismissed(true);
        }}
        className="absolute top-2 right-2 text-fg-muted/50 hover:text-fg"
        aria-label="Dismiss suggestion"
      >
        <HugeiconsIcon icon={Cancel01Icon} data-icon />
      </Button>
      <CardHeader className="flex-row items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-accent-green/15 text-accent-green">
          <HugeiconsIcon icon={GraduationCapIcon} size={16} />
        </div>
        <CardTitle className="font-bold text-sm tracking-tight">{action.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pr-6">
        <p className="text-fg-muted text-xs leading-relaxed">{action.reason}</p>
        <Link
          href={action.ctaHref}
          prefetch={true}
          className="mt-1 inline-flex min-h-11 w-fit items-center rounded-lg bg-accent-green px-4 font-semibold text-white text-xs transition-all hover:opacity-90 active:scale-[0.98]"
        >
          {action.ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
