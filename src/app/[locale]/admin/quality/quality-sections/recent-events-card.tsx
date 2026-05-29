"use client";

import { Badge } from "@/components/ui/badge";

interface EngineEvent {
	event: string;
	success: boolean;
	subject?: string;
	questionType?: string;
	timestamp: string | number;
}

interface RecentEventsCardProps {
	events: EngineEvent[];
}

function Timestamp({ time }: { time: string | number }) {
	return (
		<span className="text-muted-foreground">
			{new Date(time).toLocaleTimeString()}
		</span>
	);
}

export function RecentEventsCard({ events }: RecentEventsCardProps) {
	return (
		<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
			<header>
				<h2 className="font-heading font-medium text-lg">Recent Events</h2>
			</header>
			<div className="px-4 group-data-[size=sm]/card:px-3">
				{events.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						No events recorded yet
					</p>
				) : (
					<div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
						{events.map((e) => (
							<div
								key={`${e.event}-${e.timestamp}`}
								className="flex items-center gap-2 font-mono text-xs"
							>
								<Badge
									variant={e.success ? "secondary" : "destructive"}
									className="px-1 py-0 text-[10px]"
								>
									{e.event}
								</Badge>
								<span className="text-muted-foreground">
									{e.subject || "-"}
								</span>
								<span className="text-muted-foreground">
									{e.questionType || "-"}
								</span>
								<span className="ml-auto text-muted-foreground">
									<Timestamp time={e.timestamp} />
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
