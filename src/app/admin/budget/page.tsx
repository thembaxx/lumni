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

const CARD_CLASS =
	"overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors";

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
				<div className="min-w-0">
					<h1 className="text-xl font-extrabold tracking-tight">
						Token Budget
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						AI call usage for this session. Resets at midnight.
					</p>
				</div>
				<Button
					onClick={fetchBudget}
					disabled={loading}
					variant="outline"
					className="shrink-0"
				>
					{loading ? "Loading\u2026" : "Refresh"}
				</Button>
			</div>

			{error && (
				<div className="overflow-hidden rounded-[2.5rem] border border-destructive bg-destructive/5 p-4 text-sm text-destructive">
					{error}
				</div>
			)}

			{loading && !data && <Skeleton shape="card" className="h-48" />}

			{data && (
				<>
					<div className={CARD_CLASS}>
						<header className="px-6 pt-5 pb-3">
							<h2 className="text-sm font-semibold tracking-tight">Global</h2>
						</header>
						<div className="px-6 pb-5">
							<div className="flex items-center gap-3">
								<div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
									<div
										className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-ios-decelerate"
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
					</div>

					<div className={CARD_CLASS}>
						<header className="px-6 pt-5 pb-3">
							<h2 className="text-sm font-semibold tracking-tight">
								Usage by type
							</h2>
						</header>
						<div className="px-6 pb-5 space-y-4">
							{Object.entries(data.user.usage).map(([type, usage]) => {
								const pct =
									usage.limit > 0 ? (usage.count / usage.limit) * 100 : 0;
								const exhausted = pct >= 80;
								const warning = pct >= 50 && !exhausted;
								return (
									<div key={type}>
										<div className="flex items-center justify-between text-sm mb-1.5">
											<span className="font-medium capitalize">{type}</span>
											<span className="text-muted-foreground tabular-nums">
												{usage.count} / {usage.limit}
												{usage.tokens > 0 && ` \u00B7 ${usage.tokens} tokens`}
											</span>
										</div>
										<div className="h-2 rounded-full bg-secondary overflow-hidden">
											<div
												className={`h-full rounded-full transition-[width,background-color] duration-500 ease-ios-decelerate ${
													exhausted
														? "bg-destructive"
														: warning
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
