"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

interface RoleGateProps {
	role: "teacher" | "parent" | "student";
	fallback?: ReactNode;
	children: ReactNode;
}

export function RoleGate({ role, fallback, children }: RoleGateProps) {
	const { user } = useAuth();
	const hasRole = user?.labels?.includes(role);

	const { data: sessionRole } = useQuery({
		queryKey: ["session"],
		queryFn: async () => {
			const res = await fetch("/api/session");
			const data = (await res.json()) as { labels?: string[] };
			return data.labels?.includes(role) ?? false;
		},
		enabled: !hasRole && !!user,
	});

	const authorized = hasRole || sessionRole;

	if (!authorized) {
		return fallback ?? null;
	}

	return <>{children}</>;
}
