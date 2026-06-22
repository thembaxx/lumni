"use client";

import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { RoleSelector } from "@/components/settings/tabs/role-selector";
import { ListCell, ListSection } from "@/components/ui/list-cell";

interface AccountRoleSectionProps {
	labels: string[] | undefined;
}

export function AccountRoleSection({ labels }: AccountRoleSectionProps) {
	const roleLeading = useMemo(
		() => <HugeiconsIcon icon={UserIcon} className="size-5" />,
		[],
	);
	const roleTrailing = useMemo(
		() => <RoleSelector currentLabels={labels ?? []} />,
		[labels],
	);

	return (
		<ListSection header="Account Role">
			<ListCell
				leading={roleLeading}
				title="Role"
				subtitle="Controls which dashboard you see"
				showSeparator={false}
				trailing={roleTrailing}
			/>
		</ListSection>
	);
}
