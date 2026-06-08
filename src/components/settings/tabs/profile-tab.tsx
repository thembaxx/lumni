"use client";

import { CompassIcon, Login01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useState } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ParentConsentSection } from "@/components/settings/tabs/parent-consent-section";
import { AccountRoleSection } from "@/components/settings/tabs/sections/account-role-section";
import { ConfirmDialog } from "@/components/settings/tabs/sections/confirm-dialog";
import { PasswordSection } from "@/components/settings/tabs/sections/password-section";
import { PersonalInfoSection } from "@/components/settings/tabs/sections/personal-info-section";
import { ProfileAvatarSection } from "@/components/settings/tabs/sections/profile-avatar-section";
import { SchoolDetailsSection } from "@/components/settings/tabs/sections/school-details-section";
import { ShareProfileSection } from "@/components/settings/tabs/sections/share-profile-section";
import { SignOutSection } from "@/components/settings/tabs/sections/sign-out-section";
import { SubjectPicker } from "@/components/settings/tabs/sections/subject-picker";
import { EmptyStateWithIllustration } from "@/components/shared/empty-state";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { useEnrolledSubjects } from "@/hooks/use-subjects";
import { useAuth } from "@/lib/auth/auth-context";
import { toggleUserSubject } from "@/lib/server";
import { useUploadThing } from "@/lib/uploadthing";

const guidedSetupLeading = (
	<HugeiconsIcon icon={CompassIcon} className="size-5" />
);

const guidedSetupTrailing = (
	<span className="text-(length:--fs-footnote) font-semibold text-system-accent">
		Redo
	</span>
);

const initialDrafts = {
	schoolDraft: "",
	gradeDraft: "",
	provinceDraft: "",
};

type ProfileDraftState = typeof initialDrafts;

function draftReducer(
	state: ProfileDraftState,
	action:
		| { type: "SET_ALL"; drafts: ProfileDraftState }
		| { type: "SET_FIELD"; field: keyof ProfileDraftState; value: unknown },
): ProfileDraftState {
	switch (action.type) {
		case "SET_ALL":
			return action.drafts;
		case "SET_FIELD":
			return { ...state, [action.field]: action.value };
	}
}

async function toggleProfileSubject(
	userId: string,
	subjectId: string,
	queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> {
	try {
		await toggleUserSubject(userId, subjectId);
		queryClient.invalidateQueries({ queryKey: ["subjects"] });
		queryClient.invalidateQueries({
			queryKey: ["user-subjects", userId],
		});
	} catch (e) {
		console.warn("[Profile] Failed to save subjects", e);
	}
}

export function ProfileTab() {
	const { user, isAnonymous, updateProfile, verifyEmail, signOut, error } =
		useAuth();
	const isLoggedIn = !!user && !isAnonymous;
	const { startUpload } = useUploadThing("avatarUploader");
	const [showGuidedSetup, setShowGuidedSetup] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	const [drafts, dispatchDrafts] = useReducer(draftReducer, initialDrafts);
	const { schoolDraft, gradeDraft, provinceDraft } = drafts;
	const [uploading, setUploading] = useState(false);

	const prefs = (user?.prefs as Record<string, unknown>) || {};

	useEffect(() => {
		dispatchDrafts({
			type: "SET_ALL",
			drafts: {
				schoolDraft: (prefs.school as string) || "",
				gradeDraft: (prefs.grade as string) || "",
				provinceDraft: (prefs.province as string) || "",
			},
		});
	}, [prefs.school, prefs.grade, prefs.province]);

	const handleAvatarUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			setUploading(true);
			try {
				const result = await startUpload([file]);
				if (result?.[0]?.ufsUrl) {
					const p = (user?.prefs as Record<string, unknown>) || {};
					await updateProfile({
						prefs: { ...p, avatarUrl: result[0].ufsUrl },
					});
				}
			} catch {
			} finally {
				setUploading(false);
			}
		},
		[startUpload, updateProfile, user],
	);

	const handleSaveField = useCallback(
		async (key: string, value: unknown) => {
			const p = (user?.prefs as Record<string, unknown>) || {};
			await updateProfile({ prefs: { ...p, [key]: value } });
		},
		[updateProfile, user],
	);

	const {
		enrolledSubjects,
		subjects: allSubjects,
		isEnrolled,
	} = useEnrolledSubjects();
	const queryClient = useQueryClient();

	const handleToggleSubject = useCallback(
		async (subjectId: string) => {
			if (!user) return;
			await toggleProfileSubject(user.$id, subjectId, queryClient);
		},
		[user, queryClient],
	);

	if (!isLoggedIn) {
		return (
			<div className="flex flex-col gap-10 pt-8">
				<EmptyStateWithIllustration
					icon={Login01Icon}
					title="Sign in to manage your profile"
					description="Create an account or sign in to update your name, change your password, manage your school details, and sync your progress across all your devices."
					action={{
						label: "Sign In",
						onClick: () => {
							window.location.href = "/auth/sign-in?redirect=/settings";
						},
					}}
					secondaryAction={{
						label: "Create Account",
						onClick: () => {
							window.location.href = "/auth/sign-up?redirect=/settings";
						},
					}}
				/>
				<div className="flex flex-col items-center gap-1 px-2">
					<p className="text-(length:--fs-footnote) font-extrabold text-[--system-text-tertiary] uppercase tracking-widest">
						Lumni Mobile
					</p>
					<p className="text-(length:--fs-caption-2) font-medium text-[--system-text-tertiary] tabular-nums">
						Version 1.0.4 (Stable-RC)
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-10">
			<ProfileAvatarSection
				avatarUrl={prefs?.avatarUrl as string}
				name={user?.name || ""}
				email={user?.email}
				emailVerified={user?.emailVerification}
				uploading={uploading}
				onVerifyEmail={verifyEmail}
				onAvatarUpload={handleAvatarUpload}
			/>

			{error && (
				<p className="ios-footnote -mt-6 text-center font-medium text-destructive">
					{error}
				</p>
			)}

			<PersonalInfoSection
				user={user}
				isAnonymous={isAnonymous}
				onUpdateName={async (v) => updateProfile({ name: v })}
			/>

			{isLoggedIn && <PasswordSection />}

			<SchoolDetailsSection
				schoolDraft={schoolDraft}
				gradeDraft={gradeDraft}
				provinceDraft={provinceDraft}
				onSaveSchool={async (v) => {
					dispatchDrafts({ type: "SET_FIELD", field: "schoolDraft", value: v });
					await handleSaveField("school", v);
				}}
				onSaveGrade={async (v) => {
					dispatchDrafts({ type: "SET_FIELD", field: "gradeDraft", value: v });
					await handleSaveField("grade", v);
				}}
				onSaveProvince={async (v) => {
					dispatchDrafts({
						type: "SET_FIELD",
						field: "provinceDraft",
						value: v,
					});
					await handleSaveField("province", v);
				}}
			/>

			<ListSection header="Subjects (Optional)">
				<SubjectPicker
					enrolled={enrolledSubjects}
					available={allSubjects}
					isEnrolled={isEnrolled}
					onToggle={handleToggleSubject}
				/>
			</ListSection>

			<AccountRoleSection labels={user?.labels} />

			<ShareProfileSection userId={user?.$id} />

			{user?.labels?.includes("student") && (
				<ParentConsentSection userId={user.$id} />
			)}

			<ListSection header="Study Goals">
				<ListCell
					leading={guidedSetupLeading}
					title="Guided Setup"
					subtitle="Set your subjects, targets, and study schedule"
					showSeparator={false}
					trailing={guidedSetupTrailing}
					onClick={() => setShowConfirmDialog(true)}
				/>
			</ListSection>

			<ConfirmDialog
				open={showConfirmDialog}
				title="Redo Guided Setup?"
				description="This will update your subjects, study goals, and preferences. Ready to set them up again?"
				confirmLabel="Let's do it"
				onConfirm={() => {
					setShowConfirmDialog(false);
					setShowGuidedSetup(true);
				}}
				onCancel={() => setShowConfirmDialog(false)}
			/>

			{showGuidedSetup && (
				<OnboardingWizard onComplete={() => setShowGuidedSetup(false)} />
			)}

			{isAnonymous && (
				<div className="rounded-xl border border-system-accent/10 bg-system-accent/5 px-2 py-4">
					<p className="text-center text-muted-foreground text-sm">
						You&apos;re browsing as a guest.{" "}
						<button
							type="button"
							onClick={() => {
								window.location.href = "/auth/sign-up";
							}}
							className="font-semibold text-system-accent hover:underline"
						>
							Sign up
						</button>{" "}
						to save your progress across devices.
					</p>
				</div>
			)}

			<SignOutSection isAnonymous={isAnonymous} onSignOut={signOut} />
		</div>
	);
}
