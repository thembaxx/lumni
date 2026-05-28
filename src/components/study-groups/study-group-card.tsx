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
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDeleteGroup, useLeaveGroup } from "@/hooks/use-study-groups";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/shared";
import type {
	GroupChallenge,
	GroupChallengeEntry,
} from "@/lib/study-groups/challenge-types";
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

	const { data: challengeData } = useQuery({
		queryKey: ["group-challenge", group.$id],
		queryFn: async () => {
			const res = await fetch(`/api/study-groups/${group.$id}/challenge`);
			if (!res.ok) return null;
			return res.json() as Promise<{
				challenge: GroupChallenge;
				entries: GroupChallengeEntry[];
			}>;
		},
		staleTime: 60_000,
		retry: false,
	});

	const totalScore = challengeData
		? challengeData.entries.reduce((s, e) => s + e.combinedScore, 0)
		: 0;

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

			{challengeData && (
				<div className="flex items-center gap-2">
					<div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							className="rounded-full bg-[--system-accent] transition-all"
							style={{ width: `${Math.min(totalScore, 100)}%` }}
						/>
					</div>
					<span
						className={cn(
							"font-mono text-xs tabular-nums",
							totalScore >= 80
								? "text-success"
								: totalScore >= 40
									? "text-warning"
									: "text-muted-foreground",
						)}
					>
						{Math.round(totalScore)} pts
					</span>
				</div>
			)}

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
