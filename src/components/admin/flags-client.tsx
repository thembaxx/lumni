"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { FlagDefinition, FlagOverride } from "@/lib/shared/flags/types";
import { cn } from "@/lib/utils";

interface FlagsData {
  flags: Record<string, FlagDefinition>;
  overrides: FlagOverride[];
}

function getOverride(overrides: FlagOverride[], key: string, userId?: string): FlagOverride | undefined {
  return overrides.find((o) => o.key === key && (userId ? o.userId === userId : !o.userId));
}

function isEnabled(flag: FlagDefinition, overrides: FlagOverride[], userId: string | undefined): boolean {
  const userOv = getOverride(overrides, flag.key, userId);
  if (userOv !== undefined) return userOv.enabled;
  const globalOv = getOverride(overrides, flag.key);
  if (globalOv !== undefined) return globalOv.enabled;
  return flag.defaultEnabled;
}

export function FlagsAdminClient() {
  const queryClient = useQueryClient();
  const [userId] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return JSON.parse(localStorage.getItem("lumni_user") ?? "{}").$id ?? "";
    } catch {
      return "";
    }
  });
  const [forceUserId, setForceUserId] = useState("");

  const { data, isLoading } = useQuery<FlagsData>({
    queryKey: ["admin-flags"],
    queryFn: async () => {
      const res = await fetch("/api/admin/flags?adminKey=admin");
      if (!res.ok) throw new Error("Failed to fetch flags");
      return res.json() as Promise<FlagsData>;
    },
    staleTime: 1000 * 60,
  });

  const updateMutation = useMutation({
    mutationFn: async (override: Partial<FlagOverride> & { key: string }) => {
      const res = await fetch("/api/admin/flags?adminKey=admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(override),
      });
      if (!res.ok) throw new Error("Failed to update flag");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flags"] });
    },
  });

  const removeOverrideMutation = useMutation({
    mutationFn: async (params: { key: string; userId?: string }) => {
      const res = await fetch("/api/admin/flags?adminKey=admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Failed to remove override");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flags"] });
    },
  });

  const flags = data?.flags ?? {};
  const overrides = data?.overrides ?? [];
  const effectiveUserId = forceUserId || userId;

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 bg-background p-6">
        <h1 className="font-extrabold text-2xl">Feature Flags</h1>
        <p className="text-muted-foreground">Loading flags...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 bg-background p-6">
      <h1 className="font-extrabold text-2xl">Feature Flags &amp; Experiments</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="ff-force-user" className="text-muted-foreground text-xs">
          Force user ID for testing
        </label>
        <input
          id="ff-force-user"
          type="text"
          value={forceUserId}
          onChange={(e) => setForceUserId(e.target.value)}
          placeholder={userId || "User ID"}
          className="max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-4">
        {Object.entries(flags).map(([key, flag]) => {
          const globalOv = getOverride(overrides, key);
          const userOv = getOverride(overrides, key, effectiveUserId);
          const enabled = isEnabled(flag, overrides, effectiveUserId);

          return (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="font-mono text-sm">{key}</CardTitle>
                    {flag.isExperiment && <Badge variant="outline">A/B</Badge>}
                    <Badge variant={enabled ? "default" : "destructive"}>
                      {enabled ? "ON" : "OFF"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground text-sm">{flag.description}</p>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={globalOv?.enabled ?? flag.defaultEnabled}
                      onCheckedChange={(checked: boolean) => {
                        if (globalOv) {
                          updateMutation.mutate({
                            key,
                            enabled: checked,
                            ...(flag.rolloutPercentage !== undefined && { rolloutPercentage: globalOv.rolloutPercentage }),
                          });
                        } else {
                          updateMutation.mutate({ key, enabled: checked });
                        }
                      }}
                      aria-label={`Toggle ${key}`}
                    />
                    <span className="text-xs">Global</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (userOv) {
                        removeOverrideMutation.mutate({
                          key,
                          userId: effectiveUserId,
                        });
                      } else {
                        updateMutation.mutate({
                          key,
                          enabled: !flag.defaultEnabled,
                          userId: effectiveUserId,
                        });
                      }
                    }}
                  >
                    {userOv ? "Remove user override" : "Force enable for my user"}
                  </Button>

                  {globalOv !== undefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOverrideMutation.mutate({ key })}
                    >
                      Reset
                    </Button>
                  )}
                </div>

                {flag.rolloutPercentage !== undefined && (
                  <div className="mt-4 flex flex-col gap-2">
                    <label className="text-muted-foreground text-xs">
                      Rollout: {globalOv?.rolloutPercentage ?? flag.rolloutPercentage}%
                    </label>
                    <Slider
                      value={[globalOv?.rolloutPercentage ?? flag.rolloutPercentage]}
                      onValueChange={(val: number | readonly number[]) => {
                        const v = Array.isArray(val) ? val[0] : val;
                        updateMutation.mutate({
                          key,
                          enabled: globalOv?.enabled ?? flag.defaultEnabled,
                          rolloutPercentage: Math.round(v),
                        });
                      }}
                      min={0}
                      max={100}
                      className={cn("max-w-xs")}
                      aria-label={`${key} rollout percentage`}
                    />
                  </div>
                )}

                {flag.isExperiment && (
                  <div className="mt-3 flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">
                      Experiment &mdash; bucketKey: <code className="text-foreground">{flag.bucketKey}</code>
                      , ratio: <code className="text-foreground">{flag.experimentRatio}</code>
                    </span>
                    <span className="text-muted-foreground text-xs">
                      User bucket: <code className="text-foreground">
                        {effectiveUserId
                          ? `${key} → ${effectiveUserId.slice(0, 8)}... : ${flag.bucketKey}`
                          : "No user"}
                      </code>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
