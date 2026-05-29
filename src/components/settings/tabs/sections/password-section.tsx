"use client";

import { Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { account } from "@/lib/appwrite";

const passwordLeading = <HugeiconsIcon icon={Mail01Icon} className="size-5" />;

export function PasswordSection() {
	const passwordTrailing = useMemo(
		() => (
			<span className="text-(length:--fs-footnote) font-semibold text-system-accent">
				Update
			</span>
		),
		[],
	);

	return (
		<ListSection header="Password">
			<ListCell
				leading={passwordLeading}
				title="Change Password"
				showSeparator={false}
				trailing={passwordTrailing}
				onClick={() => {
					const current = prompt("Current password");
					if (!current) return;
					const newPwd = prompt("New password (min 8 chars)");
					if (!newPwd || newPwd.length < 8) return;
					account
						.updatePassword(newPwd, current)
						.then(() => alert("Password updated"))
						.catch((err) => alert(err.message));
				}}
			/>
		</ListSection>
	);
}
