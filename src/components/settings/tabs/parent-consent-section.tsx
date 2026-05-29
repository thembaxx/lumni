"use client";

import { LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";

import { ListCell, ListSection } from "@/components/ui/list-cell";

export function ParentConsentSection({ userId }: { userId: string }) {
	const { data: requests } = useQuery({
		queryKey: ["parent-consent-requests", userId],
		queryFn: async () => {
			const res = await fetch(
				`/api/parent/consent?studentId=${encodeURIComponent(userId)}`,
			);
			if (!res.ok) return null;
			const data = (await res.json()) as { status: string };
			return data;
		},
	});

	if (!requests) return null;

	return (
		<ListSection header="Parental Consent">
			<ListCell
				leading={<HugeiconsIcon icon={LinkSquare01Icon} className="size-5" />}
				title="Consent Status"
				subtitle={
					requests.status === "granted"
						? "A parent can view your progress"
						: requests.status === "revoked"
							? "Parent access has been revoked"
							: "No parent link active"
				}
				showSeparator={false}
				trailing={
					<span
						className={`rounded-full px-2.5 py-0.5 font-semibold text-xs ${
							requests.status === "granted"
								? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"
								: "bg-muted text-muted-foreground"
						}`}
					>
						{requests.status}
					</span>
				}
			/>
		</ListSection>
	);
}
