"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import LinkSquare01Icon from "@hugeicons/core-free-icons/LinkSquare01Icon";
import TeacherIcon from "@hugeicons/core-free-icons/TeacherIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { CLIPBOARD_CONFIRMATION_DURATION } from "@/lib/shared/durations";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { logError } from "@/lib/shared/logger";
import { cn } from "@/lib/utils";

interface ClassShellProps extends React.ComponentProps<"div"> {
  className?: string;
  isLoading?: boolean;
  role?: "teacher" | "admin";
  children: React.ReactNode;
}

export function ClassShell({
  children,
  className,
  isLoading = false,
  role = "teacher",
}: ClassShellProps) {
  const [ghostUrl, setGhostUrl] = useState<string | null>(null);
  const [ghostExpiry, setGhostExpiry] = useState<number | null>(null);
  const [ghostCopied, setGhostCopied] = useState(false);
  const ghostTokenRef = useRef<string | null>(null);

  const generateGhostLink = async () => {
    try {
      const res = await fetch("/api/teacher/ghost-link", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as {
        token: string;
        url: string;
        expiresAt: number;
      };
      setGhostUrl(data.url);
      setGhostExpiry(data.expiresAt);
      ghostTokenRef.current = data.token;
    } catch (err) {
      logError("ClassShellCreateGhostLink", err);
    }
  };

  const revokeGhostLink = async () => {
    if (!ghostTokenRef.current) return;
    try {
      await fetch("/api/teacher/ghost-link", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: ghostTokenRef.current }),
      });
      setGhostUrl(null);
      setGhostExpiry(null);
      ghostTokenRef.current = null;
    } catch (err) {
      logError("ClassShellRevokeGhostLink", err);
    }
  };

  const copyGhostUrl = () => {
    if (!ghostUrl) return;
    navigator.clipboard.writeText(`${window.location.origin}${ghostUrl}`).then(
      () => {
        setGhostCopied(true);
        setTimeout(() => setGhostCopied(false), CLIPBOARD_CONFIRMATION_DURATION);
      },
      (err) => {
        logError("GhostLinkCopy", err);
      },
    );
  };

  if (isLoading) {
    return (
      <div className={cn("flex min-h-dvh flex-col gap-6 p-4 md:p-8", className)}>
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <div className={cn("flex min-h-dvh flex-col gap-6 bg-background py-4 md:py-8", className)}>
        <PageContainer variant="wide" className="gap-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <HugeiconsIcon
                icon={role === "admin" ? BookOpen01Icon : TeacherIcon}
                size={28}
                className="text-primary"
              />
              <h1 className="font-heading font-semibold text-2xl tracking-tight">
                {role === "admin" ? "School Analytics" : "Teacher Dashboard"}
              </h1>
            </div>
            {!ghostUrl ? (
              <Button
                size="sm"
                variant="outline"
                onClick={generateGhostLink}
                className="h-8 gap-1.5 text-xs"
              >
                <HugeiconsIcon icon={LinkSquare01Icon} data-icon="inline-start" />
                Generate Ghost Link
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  Expires {ghostExpiry ? new Date(ghostExpiry).toLocaleDateString() : ""}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyGhostUrl}
                  className="h-8 gap-1.5 text-xs"
                >
                  {ghostCopied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={revokeGhostLink}
                  className="h-8 text-xs"
                >
                  Revoke
                </Button>
              </div>
            )}
          </div>
          {children}
        </PageContainer>
      </div>
    </AppErrorBoundary>
  );
}
