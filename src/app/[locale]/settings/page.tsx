import { Suspense } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
	return (
		<AppErrorBoundary>
			<Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
				<SettingsClient />
			</Suspense>
		</AppErrorBoundary>
	);
}
