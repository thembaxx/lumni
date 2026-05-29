"use client";

import {
	CompassIcon,
	Copy01Icon,
	LinkSquare01Icon,
	Login01Icon,
	Logout01Icon,
	Mail01Icon,
	MapPinIcon,
	Mortarboard01Icon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { EditableField } from "@/components/settings/tabs/editable-field";
import { ParentConsentSection } from "@/components/settings/tabs/parent-consent-section";
import { RoleSelector } from "@/components/settings/tabs/role-selector";
import { ConfirmDialog } from "@/components/settings/tabs/sections/confirm-dialog";
import { ProfileAvatarSection } from "@/components/settings/tabs/sections/profile-avatar-section";
import { ProvincePicker } from "@/components/settings/tabs/sections/province-picker";
import { SubjectPicker } from "@/components/settings/tabs/sections/subject-picker";
import { EmptyStateWithIllustration } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { useEnrolledSubjects } from "@/hooks/use-subjects";
import { toast } from "@/hooks/use-toast";
import { account } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth/auth-context";
import { toggleUserSubject } from "@/lib/server";
import { useUploadThing } from "@/lib/uploadthing";

const passwordLeading = <HugeiconsIcon icon={Mail01Icon} className="size-5" />;

const guidedSetupLeading = (
	<HugeiconsIcon icon={CompassIcon} className="size-5" />
);

// TODO(react-doctor): Extract PersonalInfoSection into separate component (~30 lines)
// TODO(react-doctor): Extract PasswordSection into separate component (~20 lines)
// TODO(react-doctor): Extract SchoolDetailsSection into separate component (~35 lines)
// TODO(react-doctor): Extract SubjectsSection into separate component (~8 lines)
// TODO(react-doctor): Extract AccountRoleSection into separate component (~10 lines)
// TODO(react-doctor): Extract ShareProfileSection into separate component (~15 lines)
// TODO(react-doctor): Extract StudyGoalsSection into separate component (~20 lines)
// TODO(react-doctor): Extract SignOutSection into separate component (~20 lines)
export function ProfileTab() {
	const { user, isAnonymous, updateProfile, verifyEmail, signOut, error } =
		useAuth();
	const { startUpload } = useUploadThing("avatarUploader");
	const [showGuidedSetup, setShowGuidedSetup] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	type ProfileDraftState = {
		schoolDraft: string;
		gradeDraft: string;
		provinceDraft: string;
	};

	const initialDrafts: ProfileDraftState = {
		schoolDraft: "",
		gradeDraft: "",
		provinceDraft: "",
	};

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
			try {
				await toggleUserSubject(user.$id, subjectId);
				queryClient.invalidateQueries({ queryKey: ["subjects"] });
				queryClient.invalidateQueries({
					queryKey: ["user-subjects", user.$id],
				});
			} catch {}
		},
		[user, queryClient],
	);

	const displayNameLeading = useMemo(
		() => <HugeiconsIcon icon={UserIcon} className="size-5" />,
		[],
	);
	const displayNameTrailing = useMemo(
		() => (
			<EditableField
				value={user?.name || ""}
				onSave={async (v) => updateProfile({ name: v })}
				placeholder="Your name"
			/>
		),
		[user, updateProfile],
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
	const passwordTrailing = useMemo(
		() => (
			<span className="text-(length:--fs-footnote) font-semibold text-system-accent">
				Update
			</span>
		),
		[],
	);
	const schoolLeading = useMemo(
		() => <HugeiconsIcon icon={Mortarboard01Icon} className="size-5" />,
		[],
	);
	const schoolTrailing = useMemo(
		() => (
			<EditableField
				value={schoolDraft}
				onSave={async (v) => {
					dispatchDrafts({
						type: "SET_FIELD",
						field: "schoolDraft",
						value: v,
					});
					await handleSaveField("school", v);
				}}
				placeholder="Your school name"
			/>
		),
		[schoolDraft, handleSaveField],
	);
	const gradeLeading = useMemo(
		() => <HugeiconsIcon icon={Mortarboard01Icon} className="size-5" />,
		[],
	);
	const gradeTrailing = useMemo(
		() => (
			<EditableField
				value={gradeDraft}
				onSave={async (v) => {
					dispatchDrafts({
						type: "SET_FIELD",
						field: "gradeDraft",
						value: v,
					});
					await handleSaveField("grade", v);
				}}
				placeholder="e.g. Grade 12"
			/>
		),
		[gradeDraft, handleSaveField],
	);
	const provinceLeading = useMemo(
		() => <HugeiconsIcon icon={MapPinIcon} className="size-5" />,
		[],
	);
	const provinceTrailing = useMemo(
		() => (
			<ProvincePicker
				value={provinceDraft}
				onSelect={async (p) => {
					dispatchDrafts({
						type: "SET_FIELD",
						field: "provinceDraft",
						value: p,
					});
					await handleSaveField("province", p);
				}}
			/>
		),
		[provinceDraft, handleSaveField],
	);
	const roleLeading = useMemo(
		() => <HugeiconsIcon icon={UserIcon} className="size-5" />,
		[],
	);
	const roleTrailing = useMemo(
		() => <RoleSelector currentLabels={user?.labels ?? []} />,
		[user],
	);
	const shareLeading = useMemo(
		() => <HugeiconsIcon icon={LinkSquare01Icon} className="size-5" />,
		[],
	);
	const shareTrailing = useMemo(
		() => (
			<button
				type="button"
				onClick={async () => {
					if (user?.$id) {
						await navigator.clipboard.writeText(user.$id);
						toast({
							type: "success",
							message: "User ID copied to clipboard",
						});
					}
				}}
				className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-accent text-white hover:bg-system-accent/90"
				aria-label="Copy user ID"
			>
				<HugeiconsIcon icon={Copy01Icon} className="size-4" />
			</button>
		),
		[user],
	);
	const guidedSetupTrailing = useMemo(
		() => (
			<span className="text-(length:--fs-footnote) font-semibold text-system-accent">
				Redo
			</span>
		),
		[],
	);

	if (isAnonymous) {
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

			{!isAnonymous && (
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
			)}

			<ListSection header="School Details (Optional)">
				<ListCell
					leading={schoolLeading}
					title="School"
					showSeparator
					trailing={schoolTrailing}
				/>
				<ListCell
					leading={gradeLeading}
					title="Grade"
					showSeparator
					trailing={gradeTrailing}
				/>
				<ListCell
					leading={provinceLeading}
					title="Province"
					showSeparator={false}
					trailing={provinceTrailing}
				/>
			</ListSection>

			<ListSection header="Subjects (Optional)">
				<SubjectPicker
					enrolled={enrolledSubjects}
					available={allSubjects}
					isEnrolled={isEnrolled}
					onToggle={handleToggleSubject}
				/>
			</ListSection>

			<ListSection header="Account Role">
				<ListCell
					leading={roleLeading}
					title="Role"
					subtitle="Controls which dashboard you see"
					showSeparator={false}
					trailing={roleTrailing}
				/>
			</ListSection>

			<ListSection header="Share Profile">
				<ListCell
					leading={shareLeading}
					title="Your User ID"
					subtitle="Share this with your teacher or parent to link accounts"
					showSeparator={false}
					trailing={shareTrailing}
				/>
			</ListSection>

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

			<div className="px-2 pt-4">
				{!isAnonymous && (
					<Button
						size="default"
						variant="destructive"
						onClick={signOut}
						className="w-full rounded-lg font-medium text-sm shadow-level-2 transition-[transform,opacity] active:scale-[0.96]"
					>
						<HugeiconsIcon icon={Logout01Icon} data-icon />
						Sign Out
					</Button>
				)}
				<div className="mt-8 flex flex-col items-center gap-1">
					<p className="text-(length:--fs-footnote) font-extrabold text-[--system-text-tertiary] uppercase tracking-widest">
						Lumni Mobile
					</p>
					<p className="text-(length:--fs-caption-2) font-medium text-[--system-text-tertiary] tabular-nums">
						Version 1.0.4 (Stable-RC)
					</p>
				</div>
			</div>
		</div>
	);
}
