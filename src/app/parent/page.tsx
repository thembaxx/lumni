"use client";

import { useState } from "react";
import { ConsentGate } from "@/components/consent/consent-gate";
import { ParentInvitationDialog } from "@/components/consent/parent-invitation-dialog";
import { PageContainer } from "@/components/layout/page-container";
import { ActivityTimeline } from "@/components/parent/activity-timeline";
import { ChildSelector } from "@/components/parent/child-selector";
import { ParentShell } from "@/components/parent/parent-shell";
import { WeeklyReportPanel } from "@/components/parent/weekly-report-panel";
import { Button } from "@/components/ui/button";

const MOCK_CHILDREN = [
	{ id: "1", name: "Thando Molefe", initials: "TM", grade: "Matric" },
];

const MOCK_SUBJECTS = [
	{
		subject: "Mathematics",
		score: 72,
		topicsStudied: 8,
		totalTopics: 12,
		lastStudied: "2 hours ago",
	},
	{
		subject: "Physical Sciences",
		score: 65,
		topicsStudied: 5,
		totalTopics: 10,
		lastStudied: "1 day ago",
	},
	{
		subject: "Life Sciences",
		score: 81,
		topicsStudied: 6,
		totalTopics: 8,
		lastStudied: "3 hours ago",
	},
];

const MOCK_ACTIVITIES = [
	{
		id: "a1",
		type: "quiz" as const,
		description: "Completed Mathematics quiz",
		timestamp: "2 hours ago",
		subject: "Mathematics",
		score: 85,
	},
	{
		id: "a2",
		type: "flashcard" as const,
		description: "Reviewed 20 flashcards",
		timestamp: "5 hours ago",
		subject: "Physical Sciences",
	},
	{
		id: "a3",
		type: "planner" as const,
		description: "Finished study session",
		timestamp: "Yesterday",
		subject: "Life Sciences",
	},
];

export default function ParentDashboardPage() {
	const [selectedChild] = useState(MOCK_CHILDREN[0].id);
	const [consentStatus, setConsentStatus] = useState<
		"pending" | "granted" | "revoked"
	>("pending");
	const [showInvite, setShowInvite] = useState(false);
	const selectedChildData =
		MOCK_CHILDREN.find((c) => c.id === selectedChild) ?? MOCK_CHILDREN[0];

	return (
		<ParentShell hasConsent={consentStatus === "granted"}>
			<PageContainer className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<h1 className="font-bold font-heading text-2xl tracking-tight">
						Parent Dashboard
					</h1>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowInvite(true)}
					>
						Invite Another Parent
					</Button>
				</div>

				<ConsentGate
					studentName={selectedChildData.name}
					parentEmail="parent@example.com"
					status={consentStatus}
					onGrant={async () => setConsentStatus("granted")}
					onRevoke={async () => setConsentStatus("revoked")}
				/>

				{consentStatus === "granted" && (
					<>
						<ChildSelector
							students={MOCK_CHILDREN}
							selectedId={selectedChild}
							onValueChange={() => {}}
						/>
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							<div className="lg:col-span-2">
								<WeeklyReportPanel
									childName={selectedChildData.name}
									weekRange="19 May – 25 May 2026"
									subjects={MOCK_SUBJECTS}
									totalMinutes={420}
									quizzesCompleted={12}
									streakDays={5}
								/>
							</div>
							<div>
								<ActivityTimeline items={MOCK_ACTIVITIES} />
							</div>
						</div>
					</>
				)}
			</PageContainer>

			<ParentInvitationDialog
				open={showInvite}
				onOpenChange={setShowInvite}
				studentName={selectedChildData.name}
				onSend={async () => {}}
			/>
		</ParentShell>
	);
}
