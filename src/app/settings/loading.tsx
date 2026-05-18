export default function SettingsLoading() {
	return (
		<div className="flex flex-col gap-6 p-6 animate-pulse">
			<div className="h-8 w-32 rounded-lg bg-muted" />
			<div className="space-y-4">
				<div className="h-12 rounded-xl bg-muted" />
				<div className="h-12 rounded-xl bg-muted" />
				<div className="h-12 rounded-xl bg-muted" />
			</div>
		</div>
	);
}
