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
    staleTime: 60000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  if (!action || dismissed) return null;

  return (
    <Card className="relative border border-system-accent/20 bg-system-accent/[0.04]">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          dismissAction(action.kind);
          setDismissed(true);
        }}
        className="absolute top-2 right-2 text-muted-foreground/50 hover:text-foreground"
        aria-label="Dismiss suggestion"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={14} />
      </Button>
      <CardHeader className="flex-row items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-system-accent/10">
          <HugeiconsIcon icon={GraduationCapIcon} size={16} className="text-system-accent" />
        </div>
        <CardTitle className="font-semibold text-sm">{action.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pr-6">
        <p className="text-muted-foreground text-xs leading-relaxed">{action.reason}</p>
        <Link
          href={action.ctaHref}
          prefetch={true}
          className="mt-0.5 inline-flex h-9 w-fit items-center rounded-lg bg-system-accent px-4 font-medium text-white text-xs transition-[background-color,transform] hover:bg-system-accent/85 active:scale-[0.96]"
        >
          {action.ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
