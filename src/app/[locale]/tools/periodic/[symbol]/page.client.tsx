"use client";

import { useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { ElectronShellVisual } from "@/components/tools/science/electron-shell-visual";
import { elementCategoryConfig } from "@/lib/data/element-categories";
import {
  type Element,
  elements,
  getGroup,
  getPeriod,
  getStateAtRoomTemp,
} from "@/lib/data/elements";
import { logError } from "@/lib/shared/logger";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import { HugeiconsIcon } from "@hugeicons/react";

const STATE_ICONS: Record<string, string> = {
  Solid: "\u2B22",
  Liquid: "\u25C7",
  Gas: "\u2734",
  Unknown: "\u2753",
};

export function ElementDetailClient() {
  const { symbol } = useParams<{ symbol: string }>();
  const router = useRouter();
  const [interestingFact, setInterestingFact] = useState<string | null>(null);

  const element = elements.find((el) => el.symbol.toLowerCase() === (symbol ?? "").toLowerCase());

  const { mutate: generateFact } = useMutation({
    mutationFn: async (el: Element) => {
      const response = await fetch("/api/generate-element-fact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          element: { atomicNumber: el.atomicNumber, name: el.name, symbol: el.symbol },
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.fact as string | null;
    },
    onSuccess: (fact) => setInterestingFact(fact ?? null),
    onError: (error) => {
      logError("ElementFact", error);
      setInterestingFact(null);
    },
  });

  useEffect(() => {
    if (element) {
      generateFact(element);
      document.title = `${element.name} (${element.symbol}) - Lumni`;
    }
    return () => {
      document.title = "Periodic Table - Lumni";
    };
  }, [element, generateFact]);

  if (!element) {
    return (
      <div className="relative min-h-dvh bg-system-grouped pt-4">
        <AmbientGradient variant="dashboard" />
        <NoiseOverlay opacity={0.015} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <p className="font-semibold text-lg text-muted-foreground">Element not found</p>
            <p className="text-muted-foreground/60 text-sm">
              No element with symbol &ldquo;{symbol}&rdquo; exists.
            </p>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient variant="dashboard" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer className="flex items-start justify-center pt-10">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-3xl border-0 bg-(--system-background-secondary)"
          style={{
            borderColor: `oklch(${elementCategoryConfig[element.category]?.rgb} / 0.25)`,
            boxShadow: `0 0 80px oklch(${elementCategoryConfig[element.category]?.rgb} / 0.2), 0 0 160px oklch(${elementCategoryConfig[element.category]?.rgb} / 0.08)`,
          }}
        >
          <div
            className="absolute top-0 right-0 left-0 h-1"
            style={{
              background: `linear-gradient(90deg, oklch(${elementCategoryConfig[element.category]?.rgb} / 0.6), oklch(${elementCategoryConfig[element.category]?.rgb} / 1))`,
            }}
          />

          <button
            onClick={() => router.back()}
            className="absolute top-4 right-4 z-elevated rounded-xl bg-white/5 p-2 transition-[scale,background-color] duration-150 hover:scale-105 hover:bg-white/10 press-scale dark:bg-white/10 dark:hover:bg-white/15"
          >
            <HugeiconsIcon icon={Cancel01Icon} data-icon />
          </button>

          <div className="p-6 pt-8">
            <div className="mb-5 flex items-start gap-5">
              <div
                className={`${elementCategoryConfig[element.category]?.bg} flex size-20 items-center justify-center rounded-2xl text-white`}
                style={{
                  boxShadow: `0 0 30px oklch(${elementCategoryConfig[element.category]?.rgb} / 0.5), 0 0 60px oklch(${elementCategoryConfig[element.category]?.rgb} / 0.25)`,
                }}
              >
                <span className="font-extrabold text-3xl">{element.symbol}</span>
              </div>
              <div className="flex-1 pt-1">
                <h2 className="mb-1 font-semibold text-2xl">{element.name}</h2>
                <p className="text-muted-foreground/70 text-sm">
                  Atomic Number {element.atomicNumber}
                </p>
                <p className="text-muted-foreground/70 text-sm tabular-nums">
                  {element.atomicMass} u
                </p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/5 bg-white/5 p-3 dark:border-white/10 dark:bg-white/10">
                <p className="mb-1 text-muted-foreground text-xs">Period</p>
                <p className="font-semibold text-sm">{getPeriod(element.row)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3 dark:border-white/10 dark:bg-white/10">
                <p className="mb-1 text-muted-foreground text-xs">Group</p>
                <p className="font-semibold text-sm">{getGroup(element.col, element.category)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3 dark:border-white/10 dark:bg-white/10">
                <p className="mb-1 text-muted-foreground text-xs">State (25&deg;C)</p>
                <p className="flex items-center gap-1.5 font-semibold text-sm">
                  <span className="text-xs">
                    {STATE_ICONS[getStateAtRoomTemp(element.atomicNumber)]}
                  </span>
                  {getStateAtRoomTemp(element.atomicNumber)}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3 dark:border-white/10 dark:bg-white/10">
                <p className="mb-1 text-muted-foreground text-xs">Category</p>
                <p className="font-semibold text-sm">
                  {elementCategoryConfig[element.category]?.label || element.category}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-4 dark:border-white/10 dark:bg-white/10">
              <p className="mb-2 text-muted-foreground text-xs">Electron Configuration</p>
              <p className="mb-3 font-semibold text-sm">{element.electronConfig}</p>
              <ElectronShellVisual electronConfig={element.electronConfig} />
            </div>

            <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-4 dark:border-white/10 dark:bg-white/10">
              <p className="mb-1.5 text-muted-foreground text-xs">Discovery</p>
              <p className="mb-1 font-semibold text-sm">{element.discoveryYear}</p>
              <p className="text-muted-foreground/70 text-xs leading-relaxed">
                {element.namedAfter}
              </p>
            </div>

            {interestingFact && (
              <div className="rounded-xl border border-white/5 bg-white/5 p-4 dark:border-white/10 dark:bg-white/10">
                <p className="mb-1.5 text-muted-foreground text-xs">Did You Know?</p>
                <p className="text-muted-foreground/80 text-sm leading-relaxed">
                  {interestingFact}
                </p>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
