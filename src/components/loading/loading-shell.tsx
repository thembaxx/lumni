"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface LoadingShellProps {
  children: ReactNode;
}

export function LoadingShell({ children }: LoadingShellProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
      <div className="col-span-12 col-start-1 flex items-center justify-center p-[--space-8] md:col-span-7 md:p-[--space-12]">
        {children}
      </div>
      <div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {reducedMotion ? (
            <div className="aspect-square h-full w-full max-w-xs rounded-3xl bg-[--system-accent]/10 blur-2xl opacity-60" />
          ) : (
            <>
              <m.div
                className="aspect-square h-full w-full max-w-xs rounded-3xl bg-[--system-accent]/10 blur-2xl"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <m.div
                className="absolute top-[15%] left-[10%] aspect-square h-2/3 w-2/3 max-w-48 rounded-full bg-[--system-accent]/6 blur-xl"
                animate={{
                  x: [0, 28, 4, -22, 0],
                  y: [0, -12, -26, -8, 0],
                  scale: [1, 1.06, 0.94, 1.02, 1],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
