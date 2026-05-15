"use client";

import { useCallback, useEffect, useState } from "react";
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

export default function AdminBudgetPage() {
	const [data, setData] = useState<BudgetData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const fetchBudget = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/engine/budget");
			if (!res.ok) throw new Error("Failed to fetch budget");
			setData(await res.json());
		} catch (err) {
			setError(err instanceof Error ? err.message : "Network error");
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		fetchBudget();
	}, [fetchBudget]);

	return (
		<div className="min-h-[100dvh] bg-background p-6 max-w-4xl mx-auto space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-extrabold">Token Budget</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Current AI call usage (in-memory, resets at midnight)
					</p>
				</div>
				<Button onClick={fetchBudget} disabled={loading} variant="outline">
					{loading ? "Loading..." : "Refresh"}
				</Button>
			</div>

			{error && (
				<div className="rounded-xl border border-destructive bg-destructive/5 p-4 text-sm text-destructive">
					{error}
				</div>
			)}

			{loading && !data && <Skeleton className="h-48 w-full" />}

			{data && (
				<>
					<div className="rounded-xl border border-border/80 bg-card p-5">
						<h2 className="text-sm font-medium mb-3">Global</h2>
						<div className="flex items-center gap-3">
							<div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
								<div
									className="h-full rounded-full bg-foreground transition-all"
									style={{
										width: `${Math.min(100, (data.global.totalCalls / data.global.limit) * 100)}%`,
									}}
								/>
							</div>
							<span className="text-sm tabular-nums text-muted-foreground whitespace-nowrap">
								{data.global.totalCalls} / {data.global.limit}
							</span>
						</div>
					</div>

					<div className="rounded-xl border border-border/80 bg-card p-5">
						<h2 className="text-sm font-medium mb-3">
							Your usage ({data.user.id})
						</h2>
						<div className="space-y-3">
							{Object.entries(data.user.usage).map(([type, usage]) => {
								const pct =
									usage.limit > 0 ? (usage.count / usage.limit) * 100 : 0;
								return (
									<div key={type}>
										<div className="flex items-center justify-between text-sm mb-1">
											<span className="font-medium capitalize">{type}</span>
											<span className="text-muted-foreground tabular-nums">
												{usage.count} / {usage.limit}
												{usage.tokens > 0 && ` (~${usage.tokens} tokens)`}
											</span>
										</div>
										<div className="h-2 rounded-full bg-secondary overflow-hidden">
											<div
												className={`h-full rounded-full transition-all ${
													pct >= 80
														? "bg-destructive"
														: pct >= 50
															? "bg-amber-500"
															: "bg-foreground"
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
