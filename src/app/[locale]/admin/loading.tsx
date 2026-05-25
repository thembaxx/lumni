export default function AdminLoading() {
	return (
		<div className="flex animate-pulse flex-col gap-6 p-6">
			<div className="h-8 w-48 rounded-lg bg-muted" />
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="h-24 rounded-xl bg-muted" />
				<div className="h-24 rounded-xl bg-muted" />
				<div className="h-24 rounded-xl bg-muted" />
			</div>
			<div className="h-96 rounded-xl bg-muted" />
		</div>
	);
}
