"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/auth-context";

interface RoleGateProps {
  requiredRole: "teacher" | "parent" | "student";
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ requiredRole, fallback, children }: RoleGateProps) {
  const { user } = useAuth();
  const hasRole = user?.labels?.includes(requiredRole);

  const { data: sessionRole } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/session");
      const data = (await res.json()) as { labels?: string[] };
      return data.labels?.includes(requiredRole) ?? false;
    },
    enabled: !hasRole && !!user,
  });

  const authorized = hasRole || sessionRole;

  if (!authorized) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
