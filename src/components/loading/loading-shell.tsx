"use client";

import type { ReactNode } from "react";

interface LoadingShellProps {
  children: ReactNode;
}

export function LoadingShell({ children }: LoadingShellProps) {
  return (
    <div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
      <div className="col-span-12 col-start-1 flex items-center justify-center p-(--space-8) md:col-span-7 md:p-(--space-12)">
        {children}
      </div>
      <div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
        <div className="absolute inset-0 bg-linear-to-br from-system-accent/10 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="aspect-square h-full w-full max-w-xs animate-pulse rounded-3xl bg-(--system-accent)/10 blur-2xl opacity-60" />
        </div>
      </div>
    </div>
  );
}
