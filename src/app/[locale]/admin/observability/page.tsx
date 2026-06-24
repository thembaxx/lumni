"use client";

import { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearAILatencyRecords, getAILatencyStats } from "@/lib/ai/latency-tracker";
import type { CohortStats } from "@/lib/observability/events";
import { clearEvents, getCohortStats, getEventSummary } from "@/lib/observability/events";

export default function ObservabilityPage() {
  const [aiStats, setAiStats] = useState(() => getAILatencyStats());
  const [eventSummary, setEventSummary] = useState(() => getEventSummary());
  const [cohortStats, setCohortStats] = useState<CohortStats>({
    dau: 0,
    wau: 0,
    totalActiveUsers: 0,
    dailyCounts: [],
  });

  const refresh = useCallback(() => {
    setAiStats(getAILatencyStats());
    setEventSummary(getEventSummary());
    getCohortStats(30).then(setCohortStats);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl">Observability</h1>
            <p className="text-muted-foreground text-sm">
              AI latency, usage analytics, and cohort stats (local device only)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm">Total AI Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-3xl tabular-nums">{aiStats.totalCalls}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm">Avg Latency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-3xl tabular-nums">{aiStats.averageLatencyMs}ms</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-3xl tabular-nums">{aiStats.successRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm">Est. Cost (USD)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-3xl tabular-nums">
                ${(aiStats.totalCostCents / 100).toFixed(4)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Provider Stats</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(aiStats.byProvider).length === 0 ? (
                <p className="text-muted-foreground text-sm">No AI calls recorded yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(aiStats.byProvider).map(([name, stats]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <div>
                        <p className="font-medium text-sm capitalize">{name}</p>
                        <p className="text-muted-foreground text-xs">{stats.calls} calls</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm tabular-nums">{stats.averageLatencyMs}ms</p>
                        <p className="text-muted-foreground text-xs">
                          {stats.successRate}% success
                        </p>
                        <p className="font-mono text-xs tabular-nums">
                          ${(stats.totalCostCents / 100).toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="font-bold text-2xl tabular-nums">{eventSummary.totalEvents}</p>
                  <p className="text-muted-foreground text-xs">Total events</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="font-bold text-2xl tabular-nums">{eventSummary.last24h}</p>
                  <p className="text-muted-foreground text-xs">Last 24h</p>
                </div>
              </div>
              {Object.keys(eventSummary.byType).length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {Object.entries(eventSummary.byType)
                    .toSorted(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{type.replace(/_/g, " ")}</span>
                        <span className="font-mono tabular-nums">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cohort Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="font-bold text-2xl tabular-nums">{cohortStats.dau}</p>
                    <p className="text-muted-foreground text-xs">DAU</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="font-bold text-2xl tabular-nums">{cohortStats.wau}</p>
                    <p className="text-muted-foreground text-xs">WAU</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="font-bold text-2xl tabular-nums">{cohortStats.totalActiveUsers}</p>
                  <p className="text-muted-foreground text-xs">Total active (30d)</p>
                </div>
              </div>
              {cohortStats.dailyCounts.length > 0 && (
                <>
                  <p className="mb-2 font-medium text-muted-foreground text-xs">
                    Daily active users (30d)
                  </p>
                  <div className="flex flex-col gap-1">
                    {cohortStats.dailyCounts.map((d) => (
                      <div key={d.date} className="flex items-center gap-2 text-xs">
                        <span className="w-24 shrink-0 text-muted-foreground">
                          {d.date.slice(5)}
                        </span>
                        <div className="flex h-4 flex-1 overflow-hidden rounded-sm bg-muted">
                          <div
                            className="h-full rounded-sm bg-[oklch(52%_0.18_146)] transition-[width,background-color] duration-300"
                            style={{
                              width: `${Math.min(
                                (d.count /
                                  Math.max(...cohortStats.dailyCounts.map((x) => x.count), 1)) *
                                  100,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="w-6 text-right font-mono tabular-nums">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent AI Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {!aiStats.recentCalls || aiStats.recentCalls.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent calls.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {(aiStats.recentCalls ?? []).slice(0, 20).map((call) => (
                  <div
                    key={`${call.provider}-${call.timestamp}`}
                    className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-xs"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${
                        call.success ? "bg-success" : "bg-destructive"
                      }`}
                    />
                    <span className="w-20 text-muted-foreground capitalize">{call.provider}</span>
                    <span className="font-mono tabular-nums">{call.durationMs}ms</span>
                    <span className="font-mono tabular-nums">
                      ${(call.estimatedCost ?? 0.01).toFixed(4)}
                    </span>
                    <span className="ml-auto text-muted-foreground">
                      {new Date(call.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearAILatencyRecords();
              refresh();
            }}
          >
            Clear AI Records
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearEvents();
              refresh();
            }}
          >
            Clear Event Records
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
