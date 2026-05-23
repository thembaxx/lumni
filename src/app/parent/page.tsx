"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConsentGate } from "@/components/consent/consent-gate";
import { ParentInvitationDialog } from "@/components/consent/parent-invitation-dialog";
import { PageContainer } from "@/components/layout/page-container";
import { ActivityTimeline } from "@/components/parent/activity-timeline";
import { ChildSelector } from "@/components/parent/child-selector";
import { ParentShell } from "@/components/parent/parent-shell";
import { WeeklyReportPanel } from "@/components/parent/weekly-report-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/auth-context";

export default function ParentDashboardPage() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
	const [showInvite, setShowInvite] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["parent-students"],
		queryFn: async () => {
			const res = await fetch("/api/parent/students");
			if (!res.ok) throw new Error("Failed to fetch");
			return res.json() as Promise<{
				children: {
					student: {
						id: string;
						name: string;
						initials: string;
						grade: string;
					};
					subjects: {
						subject: string;
						score: number;
						topicsStudied: number;
						totalTopics: number;
						lastStudied: string;
					}[];
					activities: {
						id: string;
						type: "quiz" | "flashcard" | "exam" | "planner";
						description: string;
						timestamp: string;
						subject?: string;
						score?: number;
					}[];
				}[];
			}>;
		},
	});

	const consentMutation = useMutation({
		mutationFn: async ({
			studentId,
			action,
		}: {
			studentId: string;
			action: "grant" | "revoke";
		}) => {
			const res = await fetch("/api/parent/consent", {
				method: action === "grant" ? "POST" : "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ studentId }),
			});
			if (!res.ok) throw new Error("Consent action failed");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["parent-students"] });
			toast({ type: "success", message: "Consent updated" });
		},
		onError: () =>
			toast({ type: "error", message: "Failed to update consent" }),
	});

	const children = data?.children ?? [];
	const selectedChild =
		children.find((c) => c.student.id === selectedChildId) ?? children[0];
	const selectedId = selectedChild?.student?.id;

	const handleSendInvite = async (
		parentEmail: string,
		_canViewProgress: boolean,
		_canViewScores: boolean,
	) => {
		if (!selectedId) {
			toast({ type: "error", message: "No child selected" });
			return;
		}
		await consentMutation.mutateAsync({
			studentId: selectedId,
			action: "grant",
		});
		setShowInvite(false);
		toast({
			type: "success",
			message: `Invitation sent to ${parentEmail}`,
		});
	};

	if (isLoading) {
		return (
			<ParentShell>
				<PageContainer className="flex flex-col gap-6">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-32 w-full rounded-lg" />
				</PageContainer>
			</ParentShell>
		);
	}

	return (
		<ParentShell hasConsent={children.length > 0}>
			<PageContainer className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<h1 className="font-bold font-heading text-2xl tracking-tight">
						Parent Dashboard
					</h1>
					{selectedId && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowInvite(true)}
						>
							Update Consent
						</Button>
					)}
				</div>

				{!selectedChild ? (
					<div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
						<p className="font-medium text-muted-foreground text-lg">
							No children linked yet
						</p>
						<p className="max-w-md text-muted-foreground text-sm">
							Ask your child to share their User ID from Settings &gt; Profile,
							then ask them to grant consent from their account settings.
						</p>
					</div>
				) : (
					<>
						<ConsentGate
							studentName={selectedChild.student.name}
							parentEmail={user?.email ?? ""}
							status="granted"
							onGrant={async () => {
								await consentMutation.mutateAsync({
									studentId: selectedId,
									action: "grant",
								});
							}}
							onRevoke={async () => {
								await consentMutation.mutateAsync({
									studentId: selectedId,
									action: "revoke",
								});
							}}
						/>
						<ChildSelector
							students={children.map((c) => ({
								id: c.student.id,
								name: c.student.name,
								initials: c.student.initials,
								grade: c.student.grade,
							}))}
							selectedId={selectedId}
							onValueChange={setSelectedChildId}
						/>
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							<div className="lg:col-span-2">
								<WeeklyReportPanel
									childName={selectedChild.student.name}
									weekRange="This Week"
									subjects={selectedChild.subjects}
									totalMinutes={selectedChild.subjects.length * 30}
									quizzesCompleted={selectedChild.activities.length}
									streakDays={0}
								/>
							</div>
							<div>
								<ActivityTimeline items={selectedChild.activities} />
							</div>
						</div>
					</>
				)}
			</PageContainer>

			<ParentInvitationDialog
				open={showInvite}
				onOpenChange={setShowInvite}
				studentName={selectedChild?.student?.name ?? "your child"}
				onSend={handleSendInvite}
			/>
		</ParentShell>
	);
}
