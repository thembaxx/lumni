export default function DashboardLoading() {
	return (
		<div className="flex animate-pulse flex-col gap-4 p-6">
			<div className="h-8 w-48 rounded-lg bg-muted" />
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="h-32 rounded-xl bg-muted" />
				<div className="h-32 rounded-xl bg-muted" />
				<div className="h-32 rounded-xl bg-muted" />
			</div>
			<div className="h-64 rounded-xl bg-muted" />
		</div>
	);
}
