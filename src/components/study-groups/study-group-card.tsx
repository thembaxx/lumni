"use client";

import {
	ArrowRight01Icon,
	CheckmarkCircle01Icon,
	Copy02Icon,
	Delete02Icon,
	Logout04Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDeleteGroup, useLeaveGroup } from "@/hooks/use-study-groups";
import { useAuth } from "@/lib/auth/auth-context";
import type { StudyGroup } from "@/lib/study-groups/types";

interface Props {
	group: StudyGroup;
}

export function StudyGroupCard({ group }: Props) {
	const t = useTranslations();
	const { user } = useAuth();
	const { mutate: leaveGroup } = useLeaveGroup();
	const { mutate: deleteGroup } = useDeleteGroup();
	const [copied, setCopied] = useState(false);
	const isOwner = user?.$id === group.createdBy;

	const copyInviteCode = () => {
		navigator.clipboard.writeText(group.inviteCode);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-start justify-between">
				<div className="flex flex-col gap-1">
					<h3 className="font-semibold text-base">{group.name}</h3>
					{group.description && (
						<p className="line-clamp-2 text-muted-foreground text-sm">
							{group.description}
						</p>
					)}
				</div>
			</div>

			<div className="flex items-center gap-3 text-muted-foreground text-sm">
				<div className="flex items-center gap-1">
					<HugeiconsIcon icon={UserGroupIcon} className="size-4" />
					<span>
						{group.memberCount} {t("studyGroups.members")}
					</span>
				</div>
				{group.subjectId && (
					<Badge variant="secondary" className="text-xs">
						{group.subjectId}
					</Badge>
				)}
			</div>

			<div className="flex items-center gap-2 pt-1">
				<Button variant="outline" size="sm" onClick={copyInviteCode}>
					<HugeiconsIcon
						icon={copied ? CheckmarkCircle01Icon : Copy02Icon}
						className="size-3.5"
					/>
					{copied ? t("common.copied") : t("studyGroups.copyCode")}
				</Button>

				<Button variant="outline" size="sm" asChild>
					<a href={`/study-groups/${group.$id}`}>
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
						{t("common.open")}
					</a>
				</Button>

				<div className="ml-auto flex gap-1">
					{!isOwner && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => leaveGroup(group.$id)}
						>
							<HugeiconsIcon icon={Logout04Icon} className="size-3.5" />
						</Button>
					)}
					{isOwner && (
						<Button
							variant="ghost"
							size="sm"
							className="text-destructive"
							onClick={() => deleteGroup(group.$id)}
						>
							<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
						</Button>
					)}
				</div>
			</div>
		</Card>
	);
}
