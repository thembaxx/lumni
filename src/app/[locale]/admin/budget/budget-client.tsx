"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TypeUsage {
  count: number;
  tokens: number;
  limit: number;
}

interface BudgetData {
  user: {
    id: string;
    usage: Record<string, TypeUsage>;
  };
  global: {
    totalCalls: number;
    limit: number;
  };
}

const CARD_CLASS =
  "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors";

export function BudgetClient() {
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch: fetchBudget,
  } = useQuery({
    queryKey: ["engine-budget"],
    queryFn: async () => {
      const res = await fetch("/api/engine/budget");
      if (!res.ok) throw new Error("Failed to fetch budget");
      return res.json() as Promise<BudgetData>;
    },
  });

  const error = queryError instanceof Error ? queryError.message : "";

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 bg-background p-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="font-heading font-semibold text-2xl tracking-tight">Token Budget</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            AI call usage for this session. Resets at midnight.
          </p>
        </div>
        <Button
          onClick={() => fetchBudget()}
          disabled={loading}
          variant="outline"
          className="shrink-0"
        >
          {loading ? "Loading budget data\u2026" : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="overflow-hidden rounded-card-lg border border-destructive bg-destructive/5 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading && !data && <Skeleton shape="card" className="h-48" />}

      {data && (
        <>
          <div className={CARD_CLASS}>
            <header className="px-6 pt-5 pb-3">
              <h2 className="font-semibold text-sm tracking-tight">Global</h2>
            </header>
            <div className="px-6 pb-5">
              <div className="flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-ios-decelerate"
                    style={{
                      width: `${Math.min(100, (data.global.totalCalls / data.global.limit) * 100)}%`,
                    }}
                  />
                </div>
                <span className="whitespace-nowrap text-muted-foreground text-sm tabular-nums">
                  {data.global.totalCalls} / {data.global.limit}
                </span>
              </div>
            </div>
          </div>

          <div className={CARD_CLASS}>
            <header className="px-6 pt-5 pb-3">
              <h2 className="font-semibold text-sm tracking-tight">Usage by type</h2>
            </header>
            <div className="flex flex-col gap-4 px-6 pb-5">
              {Object.entries(data.user.usage).map(([type, usage]) => {
                const pct = usage.limit > 0 ? (usage.count / usage.limit) * 100 : 0;
                const exhausted = pct >= 80;
                const warning = pct >= 50 && !exhausted;
                return (
                  <div key={type}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{type}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {usage.count} / {usage.limit}
                        {usage.tokens > 0 && ` \u00B7 ${usage.tokens} tokens`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full transition-[width,background-color] duration-500 ease-ios-decelerate ${
                          exhausted ? "bg-destructive" : warning ? "bg-warning" : "bg-foreground"
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
