"use client";

import {
	Logout01Icon,
	Mail01Icon,
	PencilIcon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { AvatarUploader } from "@/components/molecules/avatar-uploader";
import { DangerZone } from "@/components/molecules/danger-zone";
import { ExportActions } from "@/components/molecules/export-actions";
import { StatsGrid } from "@/components/molecules/stats-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";

export function ProfileTabRefactored() {
	const { user, updateProfile, signOut } = useAuth();
	const [name, setName] = useState(user?.name || "");
	const [isUploading, setIsUploading] = useState(false);

	const initials =
		name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase() || "?";

	return (
		<div className="flex flex-col mx-auto max-w-2xl gap-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 font-heading text-base">
						<HugeiconsIcon icon={UserIcon} size={20} />
						Profile
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					<AvatarUploader
						initials={initials}
						onUpload={async () => setIsUploading(true)}
						isUploading={isUploading}
					/>
					<div className="flex flex-col gap-2">
						<Label htmlFor="name">Display Name</Label>
						<div className="flex gap-2">
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your name"
							/>
							<Button onClick={() => updateProfile({ name })} size="sm">
								<HugeiconsIcon icon={PencilIcon} size={16} />
								Save
							</Button>
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<Label>Email</Label>
						<div className="flex items-center gap-2 text-sm">
							<HugeiconsIcon
								icon={Mail01Icon}
								size={16}
								className="text-muted-foreground"
							/>
							<span>{user?.email || "Not set"}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<StatsGrid
				stats={[
					{ label: "Quizzes", value: 42, max: 100 },
					{ label: "Flashcards", value: 156, max: 500 },
					{ label: "Study Hours", value: 24, max: 100 },
					{ label: "Streak", value: 5, max: 30 },
				]}
			/>

			<ExportActions
				options={[
					{
						id: "progress",
						label: "Export Progress (CSV)",
						format: "csv",
						onExport: () => {},
					},
					{
						id: "flashcards",
						label: "Export Flashcards (JSON)",
						format: "json",
						onExport: () => {},
					},
				]}
			/>

			<Button variant="outline" className="w-full" onClick={signOut}>
				<HugeiconsIcon icon={Logout01Icon} size={16} />
				Sign Out
			</Button>

			<DangerZone
				onDeleteAccount={async () => {}}
				onClearData={async () => {}}
			/>
		</div>
	);
}
