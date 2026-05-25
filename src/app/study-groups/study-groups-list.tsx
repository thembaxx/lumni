"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/layout/page-container";
import { CreateGroupDialog } from "@/components/study-groups/create-group-dialog";
import { JoinGroupDialog } from "@/components/study-groups/join-group-dialog";
import { StudyGroupCard } from "@/components/study-groups/study-group-card";
import { Card } from "@/components/ui/card";
import { useStudyGroups } from "@/hooks/use-study-groups";

export function StudyGroupsList() {
	const t = useTranslations();
	const { data: groups, isLoading } = useStudyGroups();

	return (
		<PageContainer>
			<div className="flex flex-col gap-6 py-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-2xl">{t("studyGroups.title")}</h1>
						<p className="text-muted-foreground">{t("studyGroups.subtitle")}</p>
					</div>
					<div className="flex items-center gap-2">
						<JoinGroupDialog />
						<CreateGroupDialog />
					</div>
				</div>

				{isLoading ? (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3].map((n) => (
							<Card key={n} className="h-32 animate-pulse" />
						))}
					</div>
				) : groups && groups.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{groups.map((group) => (
							<StudyGroupCard key={group.$id} group={group} />
						))}
					</div>
				) : (
					<Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
						<p className="text-lg text-muted-foreground">
							{t("studyGroups.empty")}
						</p>
						<p className="text-muted-foreground text-sm">
							{t("studyGroups.emptyHint")}
						</p>
					</Card>
				)}
			</div>
		</PageContainer>
	);
}
