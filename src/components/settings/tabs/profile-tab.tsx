"use client";

import {
	Camera01Icon,
	Cancel01Icon,
	CheckmarkCircle01Icon,
	CompassIcon,
	Copy01Icon,
	LinkSquare01Icon,
	Login01Icon,
	Logout01Icon,
	Mail01Icon,
	MapPinIcon,
	Mortarboard01Icon,
	PencilIcon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { EmptyStateWithIllustration } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { useEnrolledSubjects } from "@/hooks/use-subjects";
import { toast } from "@/hooks/use-toast";
import { account } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth/auth-context";
import { toggleUserSubject } from "@/lib/server";
import { useUploadThing } from "@/lib/uploadthing";
import { getRandomName } from "@/lib/utils/random-name";

interface EditableFieldProps {
	value: string;
	onSave: (value: string) => Promise<void>;
	placeholder?: string;
	icon?: React.ReactNode;
}

function EditableField({
	value,
	onSave,
	placeholder,
	icon,
}: EditableFieldProps) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value);
	const [saving, setSaving] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const previousValue = useRef(value);

	useEffect(() => {
		setDraft(value);
	}, [value]);

	useEffect(() => {
		if (editing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [editing]);

	const handleSave = useCallback(async () => {
		if (draft === value) {
			setEditing(false);
			return;
		}
		setSaving(true);
		try {
			await onSave(draft);
			setEditing(false);
			previousValue.current = draft;
		} catch {
			setDraft(previousValue.current);
		} finally {
			setSaving(false);
		}
	}, [draft, value, onSave]);

	const handleCancel = useCallback(() => {
		setDraft(previousValue.current);
		setEditing(false);
	}, []);

	if (editing) {
		// Only use draft during editing; value is the source of truth when not editing
		return (
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					{icon && (
						<div className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
							{icon}
						</div>
					)}
					<Input
						ref={inputRef}
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSave();
							if (e.key === "Escape") handleCancel();
						}}
						placeholder={placeholder}
						className={`h-9 rounded-lg border-border/40 bg-system-surface text-sm ${icon ? "pl-9" : ""}`}
					/>
				</div>
				<button
					type="button"
					onClick={handleSave}
					disabled={saving || !draft.trim()}
					aria-label="Save profile changes"
					className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-accent text-white hover:bg-system-accent/90 disabled:opacity-50"
				>
					<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
				</button>
				<button
					type="button"
					onClick={handleCancel}
					aria-label="Cancel editing"
					className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-fill text-muted-foreground hover:bg-system-fill/80"
				>
					<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
				</button>
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={() => {
				setDraft(value);
				setEditing(true);
			}}
			className="group flex w-full items-center gap-2 text-left"
		>
			<span className="flex-1 truncate font-medium text-foreground text-sm">
				{value || placeholder || "Not set"}
			</span>
			<HugeiconsIcon
				icon={PencilIcon}
				className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
			/>
		</button>
	);
}

const SOUTH_AFRICAN_PROVINCES = [
	"Eastern Cape",
	"Free State",
	"Gauteng",
	"KwaZulu-Natal",
	"Limpopo",
	"Mpumalanga",
	"Northern Cape",
	"North West",
	"Western Cape",
];

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
	const [showProvincePicker, setShowProvincePicker] = useState(false);
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
					await updateProfile({
						prefs: { ...prefs, avatarUrl: result[0].ufsUrl },
					});
				}
			} catch {
			} finally {
				setUploading(false);
			}
		},
		[startUpload, updateProfile, prefs],
	);

	const handleSaveField = useCallback(
		async (key: string, value: unknown) => {
			await updateProfile({ prefs: { ...prefs, [key]: value } });
		},
		[updateProfile, prefs],
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

	const [showSubjectPicker, setShowSubjectPicker] = useState(false);

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
			<div className="flex flex-col items-center justify-center gap-4 py-8">
				<div className="group relative">
					<label htmlFor="avatar-upload" className="block cursor-pointer">
						<Avatar className="size-24 border-[6px] border-system-surface shadow-level-3 transition-transform duration-500 group-hover:scale-105">
							<AvatarImage
								src={
									(prefs?.avatarUrl as string) ??
									`https://api.dicebear.com/9.x/fun-emoji/svg?backgroundColor=ecad80,d1d4f9,b6e3f4,c0aede,ffdfbf&seed=${getRandomName()}`
								}
								alt={user?.name || "User"}
							/>

							<AvatarFallback className="bg-system-accent font-extrabold text-3xl text-white">
								{user?.name?.charAt(0)?.toUpperCase() || "U"}
							</AvatarFallback>
						</Avatar>
						<div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/10" />
						<div className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full border-[3px] border-system-surface bg-system-accent text-white shadow-level-2 transition-transform group-hover:scale-110">
							{uploading ? (
								<div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
							) : (
								<HugeiconsIcon icon={Camera01Icon} className="size-4" />
							)}
						</div>
					</label>
					<input
						id="avatar-upload"
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleAvatarUpload}
						aria-label="Upload avatar image"
					/>
				</div>
				<div className="flex flex-col gap-1 text-center">
					<h2 className="text-(length:--fs-title-2) font-semibold text-foreground">
						{user?.name || "User"}
					</h2>
					{user?.email && (
						<p className="text-(length:--fs-subhead) font-medium text-muted-foreground">
							{user.email}
							{!user.emailVerification && (
								<button
									type="button"
									onClick={verifyEmail}
									className="ml-2 font-semibold text-system-accent text-xs hover:underline"
								>
									Verify
								</button>
							)}
							{user.emailVerification && (
								<span className="ml-2 font-semibold text-emerald-500 text-xs">
									Verified
								</span>
							)}
						</p>
					)}
				</div>
			</div>

			{error && (
				<p className="ios-footnote -mt-6 text-center font-medium text-destructive">
					{error}
				</p>
			)}

			<ListSection header="Personal Information">
				<ListCell
					leading={<HugeiconsIcon icon={UserIcon} className="size-5" />}
					title="Display Name"
					showSeparator
					trailing={
						<EditableField
							value={user?.name || ""}
							onSave={async (v) => updateProfile({ name: v })}
							placeholder="Your name"
						/>
					}
				/>
				{!isAnonymous && (
					<ListCell
						leading={<HugeiconsIcon icon={Mail01Icon} className="size-5" />}
						title="Email Address"
						subtitle={user?.emailVerification ? "Verified" : "Not verified"}
						trailing={
							<span className="max-w-40 truncate text-muted-foreground text-sm">
								{user?.email}
							</span>
						}
					/>
				)}
			</ListSection>

			{!isAnonymous && (
				<ListSection header="Password">
					<ListCell
						leading={<HugeiconsIcon icon={Mail01Icon} className="size-5" />}
						title="Change Password"
						showSeparator={false}
						trailing={
							<span className="text-(length:--fs-footnote) font-semibold text-system-accent">
								Update
							</span>
						}
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
					leading={
						<HugeiconsIcon icon={Mortarboard01Icon} className="size-5" />
					}
					title="School"
					showSeparator
					trailing={
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
					}
				/>
				<ListCell
					leading={
						<HugeiconsIcon icon={Mortarboard01Icon} className="size-5" />
					}
					title="Grade"
					showSeparator
					trailing={
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
					}
				/>
				<ListCell
					leading={<HugeiconsIcon icon={MapPinIcon} className="size-5" />}
					title="Province"
					showSeparator={false}
					trailing={
						<div className="relative">
							<button
								type="button"
								onClick={() => setShowProvincePicker(!showProvincePicker)}
								className="font-medium text-sm text-system-accent hover:underline"
							>
								{provinceDraft || "Select"}
							</button>
							{showProvincePicker && (
								<div className="absolute top-8 right-0 z-drawer max-h-48 w-48 overflow-y-auto rounded-xl bg-popover p-1 shadow-level-3 ring-1 ring-foreground/10">
									{SOUTH_AFRICAN_PROVINCES.map((p) => (
										<button
											key={p}
											type="button"
											onClick={async () => {
												dispatchDrafts({
													type: "SET_FIELD",
													field: "provinceDraft",
													value: p,
												});
												await handleSaveField("province", p);
												setShowProvincePicker(false);
											}}
											className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent ${
												provinceDraft === p ? "bg-accent font-semibold" : ""
											}`}
										>
											{p}
										</button>
									))}
								</div>
							)}
						</div>
					}
				/>
			</ListSection>

			<ListSection header="Subjects (Optional)">
				<div className="flex flex-wrap gap-2 px-1">
					{enrolledSubjects.map((subject) => (
						<span
							key={subject.id}
							className="inline-flex items-center gap-1 rounded-full bg-system-accent/10 px-3 py-1.5 font-semibold text-system-accent text-xs"
						>
							{subject.name}
							<button
								type="button"
								onClick={() => handleToggleSubject(subject.id)}
								aria-label={`Remove ${subject.name}`}
								className="ml-0.5 hover:text-destructive"
							>
								<HugeiconsIcon icon={Cancel01Icon} className="size-3" />
							</button>
						</span>
					))}
					<button
						type="button"
						onClick={() => setShowSubjectPicker(!showSubjectPicker)}
						className="inline-flex items-center gap-1 rounded-full bg-system-fill px-3 py-1.5 font-semibold text-muted-foreground text-xs hover:bg-system-fill/80"
					>
						+ Add subject
					</button>
				</div>
				{showSubjectPicker && (
					<div className="mt-2 max-h-60 overflow-y-auto rounded-xl bg-popover p-2 shadow-level-2 ring-1 ring-foreground/10">
						{allSubjects
							.filter((s) => !isEnrolled(s.id))
							.map((subject) => (
								<button
									key={subject.id}
									type="button"
									onClick={() => {
										handleToggleSubject(subject.id);
										setShowSubjectPicker(false);
									}}
									className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
								>
									<div
										className="flex size-7 shrink-0 items-center justify-center rounded-lg font-extrabold text-white text-xs"
										style={{ backgroundColor: subject.color }}
									>
										{subject.name[0]}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">{subject.name}</p>
										<p className="truncate text-muted-foreground text-xs">
											{subject.category}
										</p>
									</div>
								</button>
							))}
					</div>
				)}
			</ListSection>

			<ListSection header="Account Role">
				<ListCell
					leading={<HugeiconsIcon icon={UserIcon} className="size-5" />}
					title="Role"
					subtitle="Controls which dashboard you see"
					showSeparator={false}
					trailing={<RoleSelector currentLabels={user?.labels ?? []} />}
				/>
			</ListSection>

			<ListSection header="Share Profile">
				<ListCell
					leading={<HugeiconsIcon icon={LinkSquare01Icon} className="size-5" />}
					title="Your User ID"
					subtitle="Share this with your teacher or parent to link accounts"
					showSeparator={false}
					trailing={
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
					}
				/>
			</ListSection>

			{user?.labels?.includes("student") && (
				<ParentConsentSection userId={user.$id} />
			)}

			<ListSection header="Study Goals">
				<ListCell
					leading={<HugeiconsIcon icon={CompassIcon} className="size-5" />}
					title="Guided Setup"
					subtitle="Set your subjects, targets, and study schedule"
					showSeparator={false}
					trailing={
						<span className="text-(length:--fs-footnote) font-semibold text-system-accent">
							Redo
						</span>
					}
					onClick={() => setShowConfirmDialog(true)}
				/>
			</ListSection>

			{showConfirmDialog && (
				<div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40">
					<div className="mx-4 w-full max-w-sm rounded-2xl bg-card p-6 shadow-level-3">
						<h3 className="ios-title-3 mb-2 font-semibold">
							Redo Guided Setup?
						</h3>
						<p className="ios-subhead mb-6 text-muted-foreground">
							This will update your subjects, study goals, and preferences.
							Ready to set them up again?
						</p>
						<div className="flex justify-end gap-3">
							<Button
								variant="outline"
								onClick={() => setShowConfirmDialog(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									setShowConfirmDialog(false);
									setShowGuidedSetup(true);
								}}
							>
								Let's do it
							</Button>
						</div>
					</div>
				</div>
			)}

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

const VALID_ROLES = ["teacher", "parent", "student"] as const;

function RoleSelector({ currentLabels }: { currentLabels: string[] }) {
	const queryClient = useQueryClient();
	const currentRole =
		VALID_ROLES.find((r) => currentLabels.includes(r)) ?? "student";

	const setRole = useMutation({
		mutationFn: async (role: string) => {
			const res = await fetch("/api/user/role", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role }),
			});
			if (!res.ok) throw new Error("Failed to set role");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["session"] });
			toast({ type: "success", message: "Role updated" });
		},
		onError: () => toast({ type: "error", message: "Failed to update role" }),
	});

	return (
		<div className="flex gap-1">
			{VALID_ROLES.map((role) => (
				<button
					key={role}
					type="button"
					onClick={() => setRole.mutate(role)}
					disabled={setRole.isPending}
					className={`rounded-lg px-2.5 py-1 font-semibold text-xs capitalize transition-colors ${
						currentRole === role
							? "bg-system-accent text-white"
							: "bg-system-fill text-muted-foreground hover:bg-system-fill/80"
					}`}
				>
					{role}
				</button>
			))}
		</div>
	);
}

function ParentConsentSection({ userId }: { userId: string }) {
	const { data: requests } = useQuery({
		queryKey: ["parent-consent-requests", userId],
		queryFn: async () => {
			const res = await fetch(
				`/api/parent/consent?studentId=${encodeURIComponent(userId)}`,
			);
			if (!res.ok) return null;
			const data = (await res.json()) as { status: string };
			return data;
		},
	});

	if (!requests) return null;

	return (
		<ListSection header="Parental Consent">
			<ListCell
				leading={<HugeiconsIcon icon={LinkSquare01Icon} className="size-5" />}
				title="Consent Status"
				subtitle={
					requests.status === "granted"
						? "A parent can view your progress"
						: requests.status === "revoked"
							? "Parent access has been revoked"
							: "No parent link active"
				}
				showSeparator={false}
				trailing={
					<span
						className={`rounded-full px-2.5 py-0.5 font-semibold text-xs ${
							requests.status === "granted"
								? "bg-emerald-500/10 text-emerald-600"
								: "bg-muted text-muted-foreground"
						}`}
					>
						{requests.status}
					</span>
				}
			/>
		</ListSection>
	);
}
