"use client";

interface RequestsBreakdownCardProps {
	generateCount: number;
	gradeCount: number;
	hintCount: number;
}

export function RequestsBreakdownCard({
	generateCount,
	gradeCount,
	hintCount,
}: RequestsBreakdownCardProps) {
	return (
		<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
			<header>
				<h2 className="font-heading font-medium text-lg">Requests Breakdown</h2>
			</header>
			<div className="flex flex-col gap-3 px-4 group-data-[size=sm]/card:px-3">
				<div className="flex justify-between text-sm">
					<span>Generate</span>
					<span className="font-mono">{generateCount}</span>
				</div>
				<div className="flex justify-between text-sm">
					<span>Grade</span>
					<span className="font-mono">{gradeCount}</span>
				</div>
				<div className="flex justify-between text-sm">
					<span>Hint</span>
					<span className="font-mono">{hintCount}</span>
				</div>
			</div>
		</div>
	);
}
