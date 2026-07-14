"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function BoltLoading({ subjectLabel }: { subjectLabel: string }) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex items-center gap-2 rounded-full bg-system-fill px-3 py-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-warning/60" />
            <span className="relative inline-flex size-2 rounded-full bg-warning" />
          </span>
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Loading your challenge
          </span>
        </div>
        <h1 className="ios-title-3 max-w-md text-balance text-foreground">
          Preparing a {subjectLabel} question
        </h1>
        <p className="max-w-sm text-balance text-muted-foreground text-sm">
          We&rsquo;re checking your weakest spot and lining up a focused question.
        </p>
      </div>
      <Skeleton className="h-6 w-48 rounded-full" />
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </div>
  );
}
