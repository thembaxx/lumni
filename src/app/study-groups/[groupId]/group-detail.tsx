"use client";

import {
	ArrowLeft01Icon,
	CheckmarkCircle01Icon,
	Copy02Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DiscussionFeed } from "@/components/study-groups/discussion-feed";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGroupDetail } from "@/hooks/use-study-groups";

export function GroupDetail() {
	const t = useTranslations();
	const params = useParams<{ groupId: string }>();
	const groupId = params.groupId;
	const { data, isLoading, error } = useGroupDetail(groupId);
	const [copied, setCopied] = useState(false);

	const copyInviteCode = () => {
		if (data?.group?.inviteCode) {
			navigator.clipboard.writeText(data.group.inviteCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	if (isLoading) {
		return (
			<PageContainer>
				<div className="flex flex-col gap-6 py-6">
					<div className="h-8 w-48 animate-pulse rounded bg-muted" />
					<Card className="h-64 animate-pulse" />
				</div>
			</PageContainer>
		);
	}

	if (error || !data) {
		return (
			<PageContainer>
				<div className="flex flex-col gap-6 py-6">
					<Link
						href="/study-groups"
						className="flex w-fit items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						{t("common.back")}
					</Link>
					<Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
						<p className="text-lg text-muted-foreground">{t("common.error")}</p>
						<Button variant="outline" asChild>
							<Link href="/study-groups">{t("common.back")}</Link>
						</Button>
					</Card>
				</div>
			</PageContainer>
		);
	}

	const { group, members } = data;

	return (
		<PageContainer>
			<div className="flex flex-col gap-6 py-6">
				<Link
					href="/study-groups"
					className="flex w-fit items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					{t("common.back")}
				</Link>

				<div className="flex items-start justify-between">
					<div className="flex flex-col gap-1">
						<h1 className="font-bold text-2xl">{group.name}</h1>
						{group.description && (
							<p className="text-muted-foreground">{group.description}</p>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<Card className="flex flex-col gap-4 p-4">
						<h2 className="font-semibold">{t("studyGroups.inviteCode")}</h2>
						<div className="flex items-center gap-2">
							<code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
								{group.inviteCode}
							</code>
							<Button variant="outline" size="sm" onClick={copyInviteCode}>
								<HugeiconsIcon
									icon={copied ? CheckmarkCircle01Icon : Copy02Icon}
									className="size-3.5"
								/>
								{copied ? t("common.copied") : t("studyGroups.copyCode")}
							</Button>
						</div>
						<p className="text-muted-foreground text-xs">
							{t("studyGroups.createdBy")}: {group.createdBy}
						</p>
						{group.subjectId && (
							<Badge variant="secondary" className="w-fit">
								{group.subjectId}
							</Badge>
						)}
					</Card>

					<Card className="flex flex-col gap-4 p-4">
						<div className="flex items-center gap-2">
							<HugeiconsIcon icon={UserGroupIcon} className="size-5" />
							<h2 className="font-semibold">
								{t("studyGroups.membersLabel")} (
								{members?.length || group.memberCount})
							</h2>
						</div>
						{members && members.length > 0 ? (
							<div className="flex flex-col gap-2">
								{members.map((member) => (
									<div
										key={member.$id}
										className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
									>
										<div className="flex flex-col">
											<span className="font-medium text-sm">
												{member.userName || member.userEmail || member.userId}
											</span>
											{member.userEmail && member.userName && (
												<span className="text-muted-foreground text-xs">
													{member.userEmail}
												</span>
											)}
										</div>
										<Badge
											variant={
												member.role === "admin" ? "default" : "secondary"
											}
										>
											{member.role}
										</Badge>
									</div>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								{t("studyGroups.empty")}
							</p>
						)}
					</Card>
				</div>

				<div className="flex flex-col gap-4">
					<h2 className="font-semibold text-lg">Discussions</h2>
					<DiscussionFeed groupId={groupId} />
				</div>
			</div>
		</PageContainer>
	);
}
