"use client";

import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Models } from "appwrite";
import { useMemo } from "react";
import { EditableField } from "@/components/settings/tabs/editable-field";
import { ListCell, ListSection } from "@/components/ui/list-cell";

interface PersonalInfoSectionProps {
	user: Models.User<Models.Preferences> | null;
	isAnonymous: boolean;
	onUpdateName: (name: string) => Promise<void>;
}

export function PersonalInfoSection({
	user,
	isAnonymous,
	onUpdateName,
}: PersonalInfoSectionProps) {
	const displayNameLeading = useMemo(
		() => <HugeiconsIcon icon={UserIcon} className="size-5" />,
		[],
	);
	const displayNameTrailing = useMemo(
		() => (
			<EditableField
				value={user?.name || ""}
				onSave={onUpdateName}
				placeholder="Your name"
			/>
		),
		[user, onUpdateName],
	);
	const emailLeading = useMemo(
		() => <HugeiconsIcon icon={Mail01Icon} className="size-5" />,
		[],
	);
	const emailTrailing = useMemo(
		() => (
			<span className="max-w-40 truncate text-muted-foreground text-sm">
				{user?.email}
			</span>
		),
		[user],
	);

	return (
		<ListSection header="Personal Information">
			<ListCell
				leading={displayNameLeading}
				title="Display Name"
				showSeparator
				trailing={displayNameTrailing}
			/>
			{!isAnonymous && (
				<ListCell
					leading={emailLeading}
					title="Email Address"
					subtitle={user?.emailVerification ? "Verified" : "Not verified"}
					trailing={emailTrailing}
				/>
			)}
		</ListSection>
	);
}
