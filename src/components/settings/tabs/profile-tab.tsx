"use client";

import {
	Camera01Icon,
	Cancel01Icon,
	CheckmarkCircle01Icon,
	CompassIcon,
	Logout01Icon,
	Mail01Icon,
	MapPinIcon,
	Mortarboard01Icon,
	PencilIcon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FileRouter } from "uploadthing/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { account } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth/auth-context";
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
		} catch {
			setDraft(value);
		} finally {
			setSaving(false);
		}
	}, [draft, value, onSave]);

	const handleCancel = useCallback(() => {
		setDraft(value);
		setEditing(false);
	}, [value]);

	if (editing) {
		return (
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					{icon && (
						<div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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
						className={`h-9 text-sm rounded-lg bg-system-surface border-border/40 ${icon ? "pl-9" : ""}`}
					/>
				</div>
				<button
					type="button"
					onClick={handleSave}
					disabled={saving || !draft.trim()}
					aria-label="Save profile changes"
					className="size-8 rounded-full bg-system-accent text-white flex items-center justify-center hover:bg-system-accent/90 shrink-0 disabled:opacity-50"
				>
					<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
				</button>
				<button
					type="button"
					onClick={handleCancel}
					aria-label="Cancel editing"
					className="size-8 rounded-full bg-system-fill text-muted-foreground flex items-center justify-center hover:bg-system-fill/80 shrink-0"
				>
					<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
				</button>
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={() => setEditing(true)}
			className="flex items-center gap-2 text-left w-full group"
		>
			<span className="flex-1 text-sm font-medium text-foreground truncate">
				{value || placeholder || "Not set"}
			</span>
			<HugeiconsIcon
				icon={PencilIcon}
				className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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

const COMMON_SUBJECTS = [
	"Mathematics",
	"Physical Sciences",
	"English Home Language",
	"English First Additional Language",
	"Afrikaans Home Language",
	"Afrikaans First Additional Language",
	"Life Sciences",
	"Geography",
	"History",
	"Accounting",
	"Business Studies",
	"Economics",
	"Life Orientation",
	"Information Technology",
	"Computer Applications Technology",
	"Agricultural Sciences",
	"Visual Arts",
	"Dramatic Arts",
	"Music",
	"Design",
	"Religious Studies",
	"Tourism",
	"Consumer Studies",
	"Hospitality Studies",
];

export function ProfileTab() {
	const { user, isAnonymous, updateProfile, verifyEmail, signOut, error } =
		useAuth();
	const { startUpload } = useUploadThing("avatarUploader");
	const [showGuidedSetup, setShowGuidedSetup] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	const [schoolDraft, setSchoolDraft] = useState("");
	const [gradeDraft, setGradeDraft] = useState("");
	const [provinceDraft, setProvinceDraft] = useState("");
	const [subjects, setSubjects] = useState<string[]>([]);
	const [subjectInput, setSubjectInput] = useState("");
	const [showProvincePicker, setShowProvincePicker] = useState(false);
	const [showSubjectPicker, setShowSubjectPicker] = useState(false);
	const [uploading, setUploading] = useState(false);

	const prefs = (user?.prefs as Record<string, unknown>) || {};

	useEffect(() => {
		setSchoolDraft((prefs.school as string) || "");
		setGradeDraft((prefs.grade as string) || "");
		setProvinceDraft((prefs.province as string) || "");
		setSubjects((prefs.subjects as string[]) || []);
	}, [prefs.school, prefs.grade, prefs.province, prefs.subjects]);

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

	const handleAddSubject = useCallback(
		async (subject: string) => {
			if (subjects.includes(subject)) return;
			const updated = [...subjects, subject];
			setSubjects(updated);
			await handleSaveField("subjects", updated);
			setShowSubjectPicker(false);
			setSubjectInput("");
		},
		[subjects, handleSaveField],
	);

	const handleRemoveSubject = useCallback(
		async (subject: string) => {
			const updated = subjects.filter((s) => s !== subject);
			setSubjects(updated);
			await handleSaveField("subjects", updated);
		},
		[subjects, handleSaveField],
	);

	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-col items-center justify-center py-8 gap-4">
				<div className="relative group">
					<label htmlFor="avatar-upload" className="cursor-pointer block">
						<Avatar className="size-24 shadow-level-3 border-[6px] border-system-surface transition-transform duration-500 group-hover:scale-105">
							<AvatarImage
								src={
									(prefs?.avatarUrl as string) ??
									`https://api.dicebear.com/9.x/fun-emoji/svg?backgroundColor=ecad80,d1d4f9,b6e3f4,c0aede,ffdfbf&seed=${getRandomName()}`
								}
								alt={user?.name || "User"}
							/>

							<AvatarFallback className="text-3xl font-extrabold bg-system-accent text-white">
								{user?.name?.charAt(0)?.toUpperCase() || "U"}
							</AvatarFallback>
						</Avatar>
						<div className="absolute inset-0 rounded-full ring-1 ring-black/10 pointer-events-none" />
						<div className="absolute -bottom-1 -right-1 size-9 rounded-full bg-system-accent shadow-level-2 border-[3px] border-system-surface flex items-center justify-center text-white group-hover:scale-110 transition-transform">
							{uploading ? (
								<div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
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
					/>
				</div>
				<div className="text-center flex flex-col gap-1">
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
									className="ml-2 text-xs font-semibold text-system-accent hover:underline"
								>
									Verify
								</button>
							)}
							{user.emailVerification && (
								<span className="ml-2 text-xs font-semibold text-emerald-500">
									Verified
								</span>
							)}
						</p>
					)}
				</div>
			</div>

			{error && (
				<p className="ios-footnote text-destructive font-medium text-center -mt-6">
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
							<span className="text-sm text-muted-foreground truncate max-w-40">
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
							<span className="text-system-accent text-(length:--fs-footnote) font-semibold">
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
								setSchoolDraft(v);
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
								setGradeDraft(v);
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
								className="text-sm font-medium text-system-accent hover:underline"
							>
								{provinceDraft || "Select"}
							</button>
							{showProvincePicker && (
								<div className="absolute right-0 top-8 z-50 w-48 max-h-48 overflow-y-auto rounded-xl bg-popover shadow-level-3 ring-1 ring-foreground/10 p-1">
									{SOUTH_AFRICAN_PROVINCES.map((p) => (
										<button
											key={p}
											type="button"
											onClick={async () => {
												setProvinceDraft(p);
												await handleSaveField("province", p);
												setShowProvincePicker(false);
											}}
											className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent ${
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
					{subjects.map((subject) => (
						<span
							key={subject}
							className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-system-accent/10 text-system-accent text-xs font-semibold"
						>
							{subject}
							<button
								type="button"
								onClick={() => handleRemoveSubject(subject)}
								aria-label={`Remove ${subject}`}
								className="ml-0.5 hover:text-destructive"
							>
								<HugeiconsIcon icon={Cancel01Icon} className="size-3" />
							</button>
						</span>
					))}
					<button
						type="button"
						onClick={() => setShowSubjectPicker(!showSubjectPicker)}
						className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-system-fill text-muted-foreground text-xs font-semibold hover:bg-system-fill/80"
					>
						+ Add subject
					</button>
				</div>
				{showSubjectPicker && (
					<div className="mt-2 p-2 rounded-xl bg-popover shadow-level-2 ring-1 ring-foreground/10">
						<Input
							value={subjectInput}
							onChange={(e) => setSubjectInput(e.target.value)}
							placeholder="Search subjects..."
							className="h-9 text-sm rounded-lg mb-2"
						/>
						<div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
							{COMMON_SUBJECTS.filter(
								(s) =>
									!subjects.includes(s) &&
									s.toLowerCase().includes(subjectInput.toLowerCase()),
							).map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => handleAddSubject(s)}
									className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent"
								>
									{s}
								</button>
							))}
						</div>
					</div>
				)}
			</ListSection>

			<ListSection header="Study Goals">
				<ListCell
					leading={<HugeiconsIcon icon={CompassIcon} className="size-5" />}
					title="Guided Setup"
					subtitle="Set your subjects, targets, and study schedule"
					showSeparator={false}
					trailing={
						<span className="text-system-accent text-(length:--fs-footnote) font-semibold">
							Redo
						</span>
					}
					onClick={() => setShowConfirmDialog(true)}
				/>
			</ListSection>

			{showConfirmDialog && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
					<div className="mx-4 w-full max-w-sm rounded-2xl bg-card shadow-level-3 p-6">
						<h3 className="ios-title-3 font-semibold mb-2">
							Redo Guided Setup?
						</h3>
						<p className="ios-subhead text-muted-foreground mb-6">
							This will update your subjects, study goals, and preferences.
							Ready to set them up again?
						</p>
						<div className="flex gap-3 justify-end">
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
				<div className="px-2 py-4 rounded-xl bg-system-accent/5 border border-system-accent/10">
					<p className="text-sm text-center text-muted-foreground">
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
					<p className="text-(length:--fs-footnote) text-[--system-text-tertiary] font-extrabold tracking-widest uppercase">
						Lumni Mobile
					</p>
					<p className="text-(length:--fs-caption-2) text-[--system-text-tertiary] tabular-nums font-medium">
						Version 1.0.4 (Stable-RC)
					</p>
				</div>
			</div>
		</div>
	);
}
